import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { createAudioStorage } from "@/lib/server/audio-storage"
import { getServerConfig } from "@/lib/server/config"
import { logger, serializeError } from "@/lib/server/logger"
import { generatePodcast } from "@/lib/server/podcast-orchestrator"
import { createPodcastProviders } from "@/lib/server/providers"
import { checkRateLimit, getClientKey, rateLimitHeaders } from "@/lib/server/rate-limit"
import { parsePodcastRequest } from "@/lib/server/request-validation"
import type { StreamMessage } from "@/types/podcast"

export const runtime = "nodejs"
export const maxDuration = 300

const STREAM_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  "Connection": "keep-alive",
  "X-Accel-Buffering": "no",
}

function streamMessage(message: StreamMessage) {
  return `data: ${JSON.stringify(message)}\n\n`
}

function publicErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.startsWith("Server configuration is invalid")) {
    return "The server is missing required API configuration"
  }

  const candidate = error as { status?: number; statusCode?: number; code?: string; message?: string }
  if (candidate.message?.includes("invalid_api_key") || candidate.message?.includes("api_key_id_used_as_api_key")) {
    return "ELEVENLABS_API_KEY must be the secret key beginning with sk_, not the API key ID"
  }
  if (candidate.statusCode === 401 || candidate.status === 401) return "An upstream API key is invalid"
  if (candidate.statusCode === 402 || candidate.status === 402) {
    return "The text-to-speech quota is insufficient. Add ElevenLabs credits or shorten the source content."
  }
  if (candidate.statusCode === 404 || candidate.status === 404) return "The selected voice or model is unavailable"
  if (candidate.status === 413) return "The source content is too large for the selected model"
  if (candidate.status === 429 || candidate.code === "rate_limit_exceeded") return "An upstream service is busy. Please try again shortly."
  if (candidate.message === "No content could be scraped from the supplied URLs") return candidate.message
  if (candidate.message === "The language model returned an empty script") return candidate.message
  return "Podcast generation failed. Please try again."
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID()
  const rateLimit = checkRateLimit(getClientKey(request))
  const commonHeaders = { ...rateLimitHeaders(rateLimit), "X-Request-Id": requestId }

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many podcast requests. Please wait a minute and try again.", requestId },
      { status: 429, headers: commonHeaders },
    )
  }

  let input
  try {
    input = parsePodcastRequest(await request.json())
  } catch (error) {
    const message = error instanceof ZodError
      ? error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")
      : "Request body must be valid JSON"
    return NextResponse.json({ error: message, requestId }, { status: 400, headers: commonHeaders })
  }

  let config
  try {
    config = getServerConfig()
  } catch (error) {
    logger.error("podcast.configuration_failed", { requestId, ...serializeError(error) })
    return NextResponse.json({ error: publicErrorMessage(error), requestId }, { status: 503, headers: commonHeaders })
  }

  const encoder = new TextEncoder()
  const abortController = new AbortController()
  let streamClosed = false
  const abort = () => abortController.abort()
  request.signal.addEventListener("abort", abort, { once: true })

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const close = () => {
        if (streamClosed) return
        streamClosed = true
        request.signal.removeEventListener("abort", abort)
        try {
          controller.close()
        } catch {
          // The browser may have already disconnected and cancelled the stream.
        }
      }
      const send = (message: StreamMessage) => {
        if (!streamClosed && !abortController.signal.aborted) {
          try {
            controller.enqueue(encoder.encode(streamMessage(message)))
          } catch {
            streamClosed = true
            abortController.abort()
          }
        }
      }

      logger.info("podcast.started", { requestId, sourceCount: input.urls.length })
      generatePodcast({
        ...input,
        requestId,
        signal: abortController.signal,
        providers: createPodcastProviders(config),
        storage: createAudioStorage(config),
        send,
      }).catch((error) => {
        if (abortController.signal.aborted) {
          logger.info("podcast.cancelled", { requestId })
          return
        }
        logger.error("podcast.failed", { requestId, ...serializeError(error) })
        send({ type: "error", message: publicErrorMessage(error) })
      }).finally(close)
    },
    cancel() {
      streamClosed = true
      abortController.abort()
      request.signal.removeEventListener("abort", abort)
    },
  })

  return new Response(stream, { headers: { ...STREAM_HEADERS, ...commonHeaders } })
}
