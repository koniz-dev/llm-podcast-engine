import { describe, expect, test } from "bun:test"
import { createStreamParser } from "../lib/podcast"
import type { StreamMessage } from "../types/podcast"

describe("SSE stream parser", () => {
  test("preserves a message split across arbitrary chunks", () => {
    const messages: StreamMessage[] = []
    const parser = createStreamParser((message) => messages.push(message))

    parser.push('data: {"type":"cont')
    parser.push('ent","content":"hello"}\n')
    parser.push('\ndata: {"type":"complete","audioUrl":"/audio.mp3"}\n\n')
    parser.finish()

    expect(messages).toEqual([
      { type: "content", content: "hello" },
      { type: "complete", audioUrl: "/audio.mp3" },
    ])
  })

  test("supports CRLF event separators", () => {
    const messages: StreamMessage[] = []
    const parser = createStreamParser((message) => messages.push(message))
    parser.push('data: {"type":"update","message":"working"}\r\n\r\n')
    expect(messages).toEqual([{ type: "update", message: "working" }])
  })
})
