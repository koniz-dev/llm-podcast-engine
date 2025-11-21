import FirecrawlApp from '@mendable/firecrawl-js'
import dotenv from "dotenv"
import { ElevenLabsClient } from "elevenlabs"
import { writeFile } from 'fs/promises'
import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import path from 'path'
import { StreamMessage, RequestBody } from "@/types/podcast"

// Load environment variables
dotenv.config()

// Constants
const ELEVENLABS_MODEL_ID = process.env.ELEVENLABS_MODEL_ID || "eleven_turbo_v2_5"
// LLM Model Configuration
// Groq provides free tier with rate limits (varies by model)
// Free tier models (with daily/minute limits):
//   - llama-3.1-8b-instant: Fast, small, best for free tier
//   - llama-3.1-70b-versatile: Larger, better quality, may have stricter limits
//   - llama-3.3-70b-versatile: Latest, may have very strict free limits
// 
// Pricing if exceeding free tier (very cheap):
//   - llama-3.1-8b-instant: $0.05/$0.08 per million tokens
//   - llama-3.1-70b-versatile: Higher pricing
//
// Override via LLM_MODEL env var if needed
const LLM_MODEL = process.env.LLM_MODEL || "llama-3.1-8b-instant"
const GROQ_BASE_URL = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1"

const SYSTEM_PROMPT = "You are a witty tech news podcaster. Create a 5-minute script covering the top 5-10 most interesting tech stories. Summarize each story in 1-4 sentences, keeping the tone funny and entertaining. Aim for a mix of humor and information that will engage and amuse tech-savvy listeners. Focus solely on the content without any audio cues or formatting instructions. Return only the script that will be read by the text-to-speech system, without any additional instructions or metadata."

const STREAM_HEADERS = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
} as const

// Initialize clients
const firecrawlApp = new FirecrawlApp({ 
    apiKey: process.env.FIRECRAWL_API_KEY 
})

const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: GROQ_BASE_URL,
})

const elevenLabsClient = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
})

// Helper functions
const formatDate = (): string => {
    return new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    })
}

const generateAudioFileName = (): string => {
    return `${new Date().toISOString().replace(/[:.]/g, '-')}.mp3`
}

const createStreamMessage = (message: StreamMessage): string => {
    return `data: ${JSON.stringify(message)}\n\n`
}

const createAudioFileFromText = async (text: string, voiceId: string): Promise<string> => {
    try {
        if (!voiceId) {
            throw new Error('Voice ID is required. Please select a voice from the dropdown.')
        }

        const audioStream = await elevenLabsClient.textToSpeech.convertAsStream(
            voiceId,
            {
                model_id: ELEVENLABS_MODEL_ID,
                text: text,
            }
        )

        const fileName = generateAudioFileName()
        const filePath = path.join(process.cwd(), 'public', fileName)

        // Convert audio stream to buffer
        const chunks: Buffer[] = []
        for await (const chunk of audioStream) {
            chunks.push(Buffer.from(chunk))
        }
        const audioBuffer = Buffer.concat(chunks)

        await writeFile(filePath, audioBuffer)
        return fileName
    } catch (error: any) {
        console.error('Error creating audio file:', error)
        
        // Provide more helpful error messages
        if (error?.statusCode === 404) {
            throw new Error(`ElevenLabs API error: Voice ID "${voiceId}" or model "${ELEVENLABS_MODEL_ID}" not found. Please select a different voice.`)
        }
        
        if (error?.statusCode === 401) {
            throw new Error('ElevenLabs API authentication failed. Please check your ELEVENLABS_API_KEY.')
        }
        
        throw error
    }
}

const scrapeUrls = async (urls: string[]): Promise<string> => {
    const scrapePromises = urls.map((url) =>
        firecrawlApp.scrape(url, { formats: ['markdown'] })
    )

    const scrapeResults = await Promise.all(scrapePromises)

    const combinedMarkdown = scrapeResults
        .map((result, index) => {
            if ('markdown' in result && result.markdown) {
                return `\n\nFrom ${urls[index]}:\n${result.markdown}`
            }
            return ''
        })
        .filter(Boolean)
        .join('')

    return combinedMarkdown
}

const generatePodcastScript = async (
    combinedMarkdown: string,
    currentDate: string
): Promise<AsyncIterable<any>> => {
    return await openai.chat.completions.create({
        messages: [
            {
                role: "system",
                content: SYSTEM_PROMPT
            },
            {
                role: "user",
                content: `It's ${currentDate}. Create a hilarious and informative 5-minute podcast script covering the top 5-10 tech stories from the following content. Make it entertaining and engaging for our tech-loving audience. Return only the script to be read, without any formatting or instructions: ${combinedMarkdown}`
            }
        ],
        model: LLM_MODEL,
        stream: true,
    })
}

const handleError = (error: unknown): string => {
    const err = error as any
    
    // ElevenLabs specific errors
    if (err?.statusCode === 404) {
        return 'ElevenLabs voice or model not found. Please check your configuration.'
    }
    
    if (err?.statusCode === 401) {
        return 'ElevenLabs API authentication failed. Please check your API key.'
    }
    
    if (err?.statusCode === 402) {
        return 'ElevenLabs subscription limit reached. Please check your account.'
    }
    
    // LLM/Token errors
    if (err?.status === 413 || err?.code === 'rate_limit_exceeded' || err?.type === 'tokens') {
        const errorMsg = err?.message || ''
        const limitMatch = errorMsg.match(/Limit (\d+)/i)
        const requestedMatch = errorMsg.match(/Requested (\d+)/i)
        
        if (limitMatch && requestedMatch) {
            return `Request too large for model. Token limit: ${limitMatch[1]}, Requested: ${requestedMatch[1]}. Please reduce the number of URLs or select pages with less content.`
        }
        return 'Request too large for model. Token limit exceeded. Please reduce the number of URLs or select pages with less content.'
    }
    
    if (err?.status === 429) {
        return 'Too many requests. Please wait a moment and try again.'
    }
    
    return err?.message || 'An error occurred while generating the podcast'
}

// POST request handler
export async function POST(req: NextRequest) {
    const { urls, voiceId }: RequestBody = await req.json()
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
        async start(controller) {
            const sendMessage = (message: StreamMessage) => {
                controller.enqueue(encoder.encode(createStreamMessage(message)))
            }

            try {
                // Gather news from sources
                sendMessage({ type: 'update', message: "Gathering news from various sources..." })
                const currentDate = formatDate()

                // Scrape URLs
                sendMessage({ type: 'update', message: "Analyzing the latest headlines..." })
                const combinedMarkdown = await scrapeUrls(urls)

                if (!combinedMarkdown) {
                    sendMessage({ type: 'error', message: "No content could be scraped" })
                    controller.close()
                    return
                }

                // Generate podcast script
                sendMessage({ type: 'update', message: "Compiling the most interesting stories..." })
                const llmStream = await generatePodcastScript(combinedMarkdown, currentDate)

                // Stream script content
                sendMessage({ type: 'update', message: "Crafting witty commentary..." })
                let fullText = ''
                for await (const chunk of llmStream) {
                    const content = chunk.choices[0]?.delta?.content || ''
                    fullText += content
                    sendMessage({ type: 'content', content })
                }

                // Validate voiceId before generating audio
                if (!voiceId) {
                    sendMessage({ type: 'error', message: "Please select a voice before generating the podcast." })
                    controller.close()
                    return
                }

                // Generate audio file
                sendMessage({ type: 'update', message: "Preparing your personalized news roundup..." })
                const audioFileName = await createAudioFileFromText(fullText, voiceId)

                // Send completion
                sendMessage({ type: 'complete', audioFileName })
                controller.close()
            } catch (error) {
                console.error('Error in stream processing:', error)
                sendMessage({ type: 'error', message: handleError(error) })
                controller.close()
            }
        }
    })

    return new NextResponse(stream, { headers: STREAM_HEADERS })
}