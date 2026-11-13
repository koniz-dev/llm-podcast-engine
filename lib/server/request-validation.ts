import { z } from "zod"
import { isIP } from "node:net"

export const MAX_URLS = 5
export const MAX_URL_LENGTH = 2_048

function isNonPublicIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false
  }

  const [a, b] = parts
  return a === 10
    || a === 127
    || a === 0
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || (a === 192 && b === 0)
    || (a === 198 && (b === 18 || b === 19))
    || a >= 224
}

function parseIpv6Groups(hostname: string): number[] | undefined {
  const halves = hostname.split("::")
  if (halves.length > 2) return undefined
  const left = halves[0] ? halves[0].split(":") : []
  const right = halves[1] ? halves[1].split(":") : []
  const missing = 8 - left.length - right.length
  if (missing < 0 || (halves.length === 1 && missing !== 0)) return undefined
  const groups = [...left, ...Array.from({ length: missing }, () => "0"), ...right]
    .map((group) => Number.parseInt(group, 16))
  return groups.length === 8 && groups.every((group) => Number.isInteger(group) && group >= 0 && group <= 0xffff)
    ? groups
    : undefined
}

function isNonPublicIpv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase()
  const groups = parseIpv6Groups(normalized)
  if (!groups) return true
  if (groups.slice(0, 7).every((group) => group === 0) && (groups[7] === 0 || groups[7] === 1)) return true
  if ((groups[0] & 0xfe00) === 0xfc00 || (groups[0] & 0xffc0) === 0xfe80
    || (groups[0] & 0xffc0) === 0xfec0 || (groups[0] & 0xff00) === 0xff00) return true
  if (groups[0] === 0x2001 && groups[1] === 0x0db8) return true

  const isIpv4Mapped = groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff
  if (isIpv4Mapped) {
    const ipv4 = `${groups[6] >> 8}.${groups[6] & 0xff}.${groups[7] >> 8}.${groups[7] & 0xff}`
    return isNonPublicIpv4(ipv4)
  }
  return false
}

export function isSafePublicUrl(value: string): boolean {
  try {
    const url = new URL(value)
    const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "")
    const ipVersion = isIP(hostname)
    const isPrivateHostname = hostname === "localhost"
      || hostname.endsWith(".localhost")
      || hostname.endsWith(".local")
      || (ipVersion === 6 && isNonPublicIpv6(hostname))

    return (url.protocol === "http:" || url.protocol === "https:")
      && !url.username
      && !url.password
      && !isPrivateHostname
      && !(ipVersion === 4 && isNonPublicIpv4(hostname))
  } catch {
    return false
  }
}

const requestSchema = z.object({
  urls: z.array(z.string().trim().min(1).max(MAX_URL_LENGTH)).min(1).max(MAX_URLS),
  voiceId: z.string().trim().min(1).max(128).regex(/^[\w-]+$/, "Voice ID contains invalid characters"),
}).strict().superRefine((value, context) => {
  value.urls.forEach((url, index) => {
    if (!isSafePublicUrl(url)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["urls", index],
        message: "Only public HTTP(S) URLs are allowed",
      })
    }
  })
})

export type ValidPodcastRequest = z.infer<typeof requestSchema>

export function parsePodcastRequest(value: unknown): ValidPodcastRequest {
  const parsed = requestSchema.parse(value)
  return { ...parsed, urls: [...new Set(parsed.urls)] }
}
