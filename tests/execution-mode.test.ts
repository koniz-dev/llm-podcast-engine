import { describe, expect, test } from "bun:test"
import { selectPodcastExecutionMode } from "../lib/server/execution-mode"

describe("podcast execution mode", () => {
  test("prefers agent-native tools when they can satisfy the request", () => {
    expect(selectPodcastExecutionMode({
      canReadPublicUrls: true,
      canSynthesizeSpeech: true,
      hasLocalCheckout: true,
      hasLocalCli: true,
    }, true).mode).toBe("agent-native")
  })

  test("uses local fallback when agent tools cannot satisfy audio", () => {
    expect(selectPodcastExecutionMode({
      canReadPublicUrls: true,
      canSynthesizeSpeech: false,
      hasLocalCheckout: true,
      hasLocalCli: true,
    }, true).mode).toBe("local-fallback")
  })

  test("reports exact missing capabilities when neither mode is usable", () => {
    const decision = selectPodcastExecutionMode({
      canReadPublicUrls: false,
      canSynthesizeSpeech: false,
      hasLocalCheckout: false,
      hasLocalCli: false,
    }, true)
    expect(decision.mode).toBe("unavailable")
    expect(decision.missing).toContain("a public-URL reading or scraping capability")
    expect(decision.missing).toContain("a text-to-speech capability")
    expect(decision.missing).toContain("an llm-podcast-engine checkout")
  })
})
