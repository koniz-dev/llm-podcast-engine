import { describe, expect, test } from "bun:test"
import { isSafePublicUrl, parsePodcastRequest } from "../lib/server/request-validation"

describe("podcast request validation", () => {
  test("accepts public HTTP URLs and removes duplicates", () => {
    expect(parsePodcastRequest({
      urls: ["https://example.com/story", "https://example.com/story"],
      voiceId: "voice-123",
    }).urls).toEqual(["https://example.com/story"])
  })

  test.each([
    "file:///etc/passwd",
    "http://localhost:3000",
    "http://127.0.0.1/private",
    "http://10.0.0.1/private",
    "http://192.168.1.2/private",
    "http://[::1]/private",
    "http://[fc00::1]/private",
    "http://[fe80::1]/private",
    "http://[::ffff:127.0.0.1]/private",
    "http://100.64.0.1/private",
    "http://user:password@example.com/private",
  ])("rejects unsafe URL %s", (url: string) => {
    expect(isSafePublicUrl(url)).toBe(false)
  })

  test("requires a voice ID", () => {
    expect(() => parsePodcastRequest({ urls: ["https://example.com"] })).toThrow()
  })

  test("limits requests to five URLs", () => {
    const urls = Array.from({ length: 6 }, (_, index) => `https://example.com/${index}`)
    expect(() => parsePodcastRequest({ urls, voiceId: "voice-123" })).toThrow()
  })
})
