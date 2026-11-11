import { ElevenLabsClient } from "elevenlabs"
import { NextResponse } from "next/server"
import { getServerConfig } from "@/lib/server/config"
import { logger, serializeError } from "@/lib/server/logger"

export const runtime = "nodejs"

type VoiceResponse = {
  voice_id: string
  name: string
  category: string
  description: string
}

let voiceCache: { voices: VoiceResponse[]; expiresAt: number } | undefined

export async function GET() {
  try {
    const config = getServerConfig()
    if (voiceCache && voiceCache.expiresAt > Date.now()) {
      return NextResponse.json(
        { voices: voiceCache.voices },
        { headers: { "Cache-Control": "private, max-age=300" } },
      )
    }

    const client = new ElevenLabsClient({ apiKey: config.ELEVENLABS_API_KEY })
    const voices = await client.voices.getAll()
    const defaultVoices = voices.voices
      .filter((voice) => voice.category === "premade" || !voice.category)
      .map((voice) => ({
        voice_id: voice.voice_id,
        name: voice.name || "Unnamed voice",
        category: voice.category || "premade",
        description: voice.description || "",
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    voiceCache = { voices: defaultVoices, expiresAt: Date.now() + 5 * 60 * 1_000 }

    return NextResponse.json(
      { voices: defaultVoices },
      { headers: { "Cache-Control": "private, max-age=300" } },
    )
  } catch (error) {
    logger.error("voices.fetch_failed", serializeError(error))
    const candidate = error as { statusCode?: number; message?: string }
    const missingVoicePermission = candidate.message?.includes("missing_permissions")
      || candidate.message?.includes("voices_read")
    const keyIdUsed = candidate.message?.includes("api_key_id_used_as_api_key")
    const invalidKey = keyIdUsed || candidate.message?.includes("invalid_api_key")
    const status = missingVoicePermission ? 403 : invalidKey || candidate.statusCode === 401 ? 401 : 500
    const message = missingVoicePermission
      ? "ELEVENLABS_API_KEY needs the voices_read permission. Enable it in ElevenLabs and try again."
      : keyIdUsed
        ? "ELEVENLABS_API_KEY is an API key ID, not the secret key. Copy or rotate a key beginning with sk_."
        : invalidKey || candidate.statusCode === 401
          ? "ElevenLabs rejected ELEVENLABS_API_KEY. Check that the secret key is active and has the required permissions."
          : "Failed to fetch voices from ElevenLabs"
    return NextResponse.json({ error: message }, { status })
  }
}

