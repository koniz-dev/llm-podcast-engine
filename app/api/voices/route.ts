import dotenv from "dotenv"
import { ElevenLabsClient } from "elevenlabs"
import { NextRequest, NextResponse } from 'next/server'

dotenv.config()

const elevenLabsClient = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
})

export async function GET(req: NextRequest) {
    try {
        const voices = await elevenLabsClient.voices.getAll()
        
        // Filter to only show default/premade voices (not custom voices)
        // Default voices usually have specific characteristics
        const defaultVoices = voices.voices
            .filter(voice => voice.category === 'premade' || !voice.category)
            .map(voice => ({
                voice_id: voice.voice_id,
                name: voice.name,
                category: voice.category || 'premade',
                description: voice.description || '',
            }))
            .sort((a, b) => a.name.localeCompare(b.name))
        
        return NextResponse.json({ voices: defaultVoices })
    } catch (error: any) {
        console.error('Error fetching voices:', error)
        
        if (error?.statusCode === 401) {
            return NextResponse.json(
                { error: 'ElevenLabs API authentication failed. Please check your ELEVENLABS_API_KEY.' },
                { status: 401 }
            )
        }
        
        return NextResponse.json(
            { error: 'Failed to fetch voices from ElevenLabs' },
            { status: 500 }
        )
    }
}

