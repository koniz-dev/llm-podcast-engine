const WINDOW_MS = 60_000
const MAX_REQUESTS = 3

interface RateLimitEntry {
  count: number
  resetAt: number
}

const entries = new Map<string, RateLimitEntry>()

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: number
}

export function checkRateLimit(key: string, now = Date.now()): RateLimitResult {
  const existing = entries.get(key)
  const entry = !existing || existing.resetAt <= now
    ? { count: 0, resetAt: now + WINDOW_MS }
    : existing

  entry.count += 1
  entries.set(key, entry)

  if (entries.size > 5_000) {
    for (const [entryKey, value] of entries) {
      if (value.resetAt <= now) entries.delete(entryKey)
    }
  }

  return {
    allowed: entry.count <= MAX_REQUESTS,
    limit: MAX_REQUESTS,
    remaining: Math.max(0, MAX_REQUESTS - entry.count),
    resetAt: entry.resetAt,
  }
}

export function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return forwarded || request.headers.get("x-real-ip") || "anonymous"
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(Math.ceil(result.resetAt / 1_000)),
  }
}

export function resetRateLimitForTests() {
  entries.clear()
}
