import { beforeEach, describe, expect, test } from "bun:test"
import { checkRateLimit, resetRateLimitForTests } from "../lib/server/rate-limit"

describe("rate limiter", () => {
  beforeEach(resetRateLimitForTests)

  test("allows three requests per minute and rejects the fourth", () => {
    expect(checkRateLimit("client", 0).allowed).toBe(true)
    expect(checkRateLimit("client", 1).allowed).toBe(true)
    expect(checkRateLimit("client", 2).allowed).toBe(true)
    expect(checkRateLimit("client", 3).allowed).toBe(false)
    expect(checkRateLimit("client", 60_001).allowed).toBe(true)
  })
})
