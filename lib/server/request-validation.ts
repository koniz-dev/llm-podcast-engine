import { z } from "zod"

export const MAX_URLS = 5
export const MAX_URL_LENGTH = 2_048

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false
  }

  const [a, b] = parts
  return a === 10
    || a === 127
    || a === 0
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
}

export function isSafePublicUrl(value: string): boolean {
  try {
    const url = new URL(value)
    const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "")
    const isPrivateHostname = hostname === "localhost"
      || hostname.endsWith(".localhost")
      || hostname.endsWith(".local")
      || hostname === "::1"
      || hostname.startsWith("fe80:")
      || hostname.startsWith("fc")
      || hostname.startsWith("fd")

    return (url.protocol === "http:" || url.protocol === "https:")
      && !url.username
      && !url.password
      && !isPrivateHostname
      && !isPrivateIpv4(hostname)
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
