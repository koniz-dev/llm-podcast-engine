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

  test("continues after a partial scraping failure and identifies the unreadable URL", async () => {
    const events: StreamMessage[] = []
    let scrapeIndex = 0
    await generatePodcast({
      urls: ["https://example.com/good", "https://example.com/bad"],
      voiceId: "voice-1",
      requestId: "request-2",
      signal: new AbortController().signal,
      providers: {
        async scrape() {
          scrapeIndex += 1
          if (scrapeIndex === 2) throw new Error("blocked")
          return "Readable article"
        },
        async streamScript(source) {
          expect(source).toContain("Readable article")
          return "Script"
        },
        async synthesize() { return Buffer.from("audio") },
      },
      storage: { async save() { return { key: "audio.mp3", url: "/audio.mp3" } } },
      send: (event) => events.push(event),
    })

    expect(events).toContainEqual({
      type: "update",
      message: "Continuing with 1 available source(s); unreadable: https://example.com/bad",
    })
  })

  test("honors cancellation before calling a provider", async () => {
    const controller = new AbortController()
    controller.abort()
    let providerCalls = 0
    const providers = {
      async scrape() { providerCalls += 1; return "source" },
      async streamScript() { providerCalls += 1; return "script" },
      async synthesize() { providerCalls += 1; return Buffer.from("audio") },
    }
    const promise = generatePodcast({
      urls: ["https://example.com"], voiceId: "voice-1", requestId: "cancelled",
      signal: controller.signal, providers,
      storage: { async save() { providerCalls += 1; return { key: "x", url: "/x" } } },
      send: () => {},
    })
    await expect(promise).rejects.toMatchObject({ name: "AbortError" })
    expect(providerCalls).toBe(0)
  })

  test("does not store audio after a synthesis provider error", async () => {
    let storageCalls = 0
    const promise = generatePodcast({
      urls: ["https://example.com"], voiceId: "voice-1", requestId: "failed",
      signal: new AbortController().signal,
      providers: {
        async scrape() { return "source" },
        async streamScript() { return "script" },
        async synthesize() { throw new Error("provider unavailable") },
      },
      storage: {
        async save() { storageCalls += 1; return { key: "x", url: "/x" } },
      },
      send: () => {},
    })
    await expect(promise).rejects.toThrow("provider unavailable")
    expect(storageCalls).toBe(0)
  })
})
