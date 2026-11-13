import { describe, expect, test } from "bun:test"
import { resolveVoice } from "../lib/server/voice-resolution"

const voices = [
  { id: "voice-adam-123", name: "Adam", category: "premade" },
  { id: "voice-ada-456", name: "Ada", category: "custom" },
]

describe("voice resolution", () => {
  test("uses a voice ID without listing provider voices", async () => {
    let listCalls = 0
    const voice = await resolveVoice("known_voice_123", async () => {
      listCalls += 1
      return voices
    })
    expect(voice.id).toBe("known_voice_123")
    expect(listCalls).toBe(0)
  })

  test("resolves an exact case-insensitive name", async () => {
    expect(await resolveVoice("adam", async () => voices)).toEqual({ id: "voice-adam-123", name: "Adam" })
  })

  test("rejects ambiguous partial names", async () => {
    expect(resolveVoice("ad", async () => voices)).rejects.toThrow("ambiguous")
  })
})
