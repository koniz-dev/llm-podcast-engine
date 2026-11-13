import { describe, expect, test } from "bun:test"
import { synthesizeIfRequested } from "../lib/server/audio-generation"
import { parseCliArgs } from "../scripts/generate-podcast"

describe("podcast CLI", () => {
  test("defaults to script-only and does not call TTS", async () => {
    const options = parseCliArgs(["--url", "https://example.com/article"])
    let synthesisCalls = 0
    const audio = await synthesizeIfRequested(!options.scriptOnly, async () => {
      synthesisCalls += 1
      return Buffer.from("audio")
    })

    expect(options.scriptOnly).toBe(true)
    expect(audio).toBeUndefined()
    expect(synthesisCalls).toBe(0)
  })

  test("requires --audio to enable TTS", () => {
    expect(parseCliArgs(["--url", "https://example.com", "--audio"]).scriptOnly).toBe(false)
  })

  test("limits input to five unique URLs", () => {
    const args = Array.from({ length: 6 }, (_, index) => ["--url", `https://example.com/${index}`]).flat()
    expect(() => parseCliArgs(args)).toThrow("At most 5 URLs")
  })
})
