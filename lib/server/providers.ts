import FirecrawlApp from "@mendable/firecrawl-js"
import { ElevenLabsClient } from "elevenlabs"
import OpenAI from "openai"
import type { ServerConfig } from "./config"
import { buildPodcastMessages } from "./prompt"

export interface PodcastProviders {
  scrape(url: string): Promise<string>
  streamScript(sourceMaterial: string, currentDate: string, signal: AbortSignal, onChunk: (content: string) => void): Promise<string>
  synthesize(text: string, voiceId: string, signal: AbortSignal): Promise<Buffer>
}

function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) throw new DOMException("Podcast generation was cancelled", "AbortError")
}

export function createPodcastProviders(config: ServerConfig): PodcastProviders {
  const firecrawl = new FirecrawlApp({ apiKey: config.FIRECRAWL_API_KEY })
  const openai = new OpenAI({ apiKey: config.GROQ_API_KEY, baseURL: config.GROQ_BASE_URL })
  const elevenLabs = new ElevenLabsClient({ apiKey: config.ELEVENLABS_API_KEY })

  return {
    async scrape(url) {
      const result = await firecrawl.scrape(url, { formats: ["markdown"] })
      return "markdown" in result && typeof result.markdown === "string" ? result.markdown : ""
    },

    async streamScript(sourceMaterial, currentDate, signal, onChunk) {
      throwIfAborted(signal)
      const stream = await openai.chat.completions.create({
        messages: buildPodcastMessages(sourceMaterial, currentDate),
        model: config.LLM_MODEL,
        stream: true,
      }, { signal })

      let fullText = ""
      for await (const chunk of stream) {
        throwIfAborted(signal)
        const content = chunk.choices[0]?.delta?.content || ""
        if (content) {
          fullText += content
          onChunk(content)
        }
      }
      return fullText
    },

    async synthesize(text, voiceId, signal) {
      throwIfAborted(signal)
      const audioStream = await elevenLabs.textToSpeech.convertAsStream(voiceId, {
        model_id: config.ELEVENLABS_MODEL_ID,
        text,
      })

      const chunks: Buffer[] = []
      for await (const chunk of audioStream) {
        throwIfAborted(signal)
        chunks.push(Buffer.from(chunk))
      }
      return Buffer.concat(chunks)
    },
  }
}
