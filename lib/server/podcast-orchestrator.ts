import type { StreamMessage } from "@/types/podcast"
import type { AudioStorage } from "./audio-storage"
import { logger } from "./logger"
import type { PodcastProviders } from "./providers"

// Keep source + completion within the free-tier token budget of the default model.
const MAX_SOURCE_CHARACTERS = 20_000

interface GeneratePodcastOptions {
  urls: string[]
  voiceId: string
  requestId: string
  signal: AbortSignal
  providers: PodcastProviders
  storage: AudioStorage
  send: (message: StreamMessage) => void
}

function formatDate() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date())
}

function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) throw new DOMException("Podcast generation was cancelled", "AbortError")
}

export async function generatePodcast(options: GeneratePodcastOptions) {
  const { urls, voiceId, requestId, signal, providers, storage, send } = options
  const startedAt = performance.now()

  send({ type: "update", message: "Gathering content from the selected sources..." })
  const scrapeStartedAt = performance.now()
  const scrapeResults = await Promise.allSettled(urls.map((url) => providers.scrape(url)))
  throwIfAborted(signal)

  const perSourceLimit = Math.floor(MAX_SOURCE_CHARACTERS / urls.length)
  const sourceMaterial = scrapeResults.map((result, index) => {
    if (result.status === "rejected" || !result.value) return ""
    return `\n\nSource URL: ${urls[index]}\n<source>${result.value.slice(0, perSourceLimit)}</source>`
  }).filter(Boolean).join("")

  const failedSources = scrapeResults.filter((result) => result.status === "rejected").length
  logger.info("podcast.scrape_completed", {
    requestId,
    sourceCount: urls.length,
    failedSources,
    sourceCharacters: sourceMaterial.length,
    durationMs: Math.round(performance.now() - scrapeStartedAt),
  })

  if (!sourceMaterial) throw new Error("No content could be scraped from the supplied URLs")
  if (failedSources > 0) {
    send({ type: "update", message: `Continuing with ${urls.length - failedSources} available source(s)...` })
  }

  send({ type: "update", message: "Writing the podcast script..." })
  const scriptStartedAt = performance.now()
  const script = await providers.streamScript(sourceMaterial, formatDate(), signal, (content) => {
    send({ type: "content", content })
  })
  if (!script.trim()) throw new Error("The language model returned an empty script")
  logger.info("podcast.script_completed", {
    requestId,
    characters: script.length,
    durationMs: Math.round(performance.now() - scriptStartedAt),
  })

  send({ type: "update", message: "Generating and storing the audio..." })
  const audioStartedAt = performance.now()
  const audio = await providers.synthesize(script, voiceId, signal)
  throwIfAborted(signal)
  const storedAudio = await storage.save(audio, requestId)

  logger.info("podcast.completed", {
    requestId,
    audioBytes: audio.byteLength,
    audioKey: storedAudio.key,
    audioDurationMs: Math.round(performance.now() - audioStartedAt),
    totalDurationMs: Math.round(performance.now() - startedAt),
  })
  send({ type: "complete", audioUrl: storedAudio.url })
}
