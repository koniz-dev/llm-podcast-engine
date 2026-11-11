import { describe, expect, test } from "bun:test"
import { generatePodcast } from "../lib/server/podcast-orchestrator"
import type { StreamMessage } from "../types/podcast"

describe("podcast orchestrator", () => {
  test("runs providers in order and returns the stored audio URL", async () => {
    const events: StreamMessage[] = []
    const calls: string[] = []

    await generatePodcast({
      urls: ["https://example.com"],
      voiceId: "voice-1",
      requestId: "request-1",
      signal: new AbortController().signal,
      providers: {
        async scrape() {
          calls.push("scrape")
          return "A factual news story"
        },
        async streamScript(_source, _date, _signal, onChunk) {
          calls.push("script")
          onChunk("Hello world")
          return "Hello world"
        },
        async synthesize() {
          calls.push("synthesize")
          return Buffer.from("audio")
        },
      },
      storage: {
        async save() {
          calls.push("store")
          return { key: "audio.mp3", url: "https://cdn.example.com/audio.mp3" }
        },
      },
      send: (event) => events.push(event),
    })

    expect(calls).toEqual(["scrape", "script", "synthesize", "store"])
    expect(events).toContainEqual({ type: "content", content: "Hello world" })
    expect(events.at(-1)).toEqual({ type: "complete", audioUrl: "https://cdn.example.com/audio.mp3" })
  })
})
