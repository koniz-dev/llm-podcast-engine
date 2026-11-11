import { StreamMessage } from "@/types/podcast"

export const validateUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export const parseStreamMessage = (line: string): StreamMessage | null => {
  const data = line
    .split(/\r?\n/)
    .filter((part) => part.startsWith('data:'))
    .map((part) => part.slice(5).trimStart())
    .join('\n')
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

export const createStreamParser = (onMessage: (message: StreamMessage) => void) => {
  let buffer = ''

  const drain = (flush = false) => {
    while (buffer) {
      const lfBoundary = buffer.indexOf('\n\n')
      const crlfBoundary = buffer.indexOf('\r\n\r\n')
      const candidates = [lfBoundary, crlfBoundary].filter((index) => index >= 0)
      if (candidates.length === 0 && !flush) return

      const boundary = candidates.length > 0 ? Math.min(...candidates) : buffer.length
      const separatorLength = boundary === crlfBoundary ? 4 : 2
      const event = buffer.slice(0, boundary)
      buffer = candidates.length > 0 ? buffer.slice(boundary + separatorLength) : ''
      const message = parseStreamMessage(event)
      if (message) onMessage(message)
    }
  }

  return {
    push(chunk: string) {
      buffer += chunk
      drain()
    },
    finish() {
      drain(true)
    },
  }
}

export const downloadFile = (url: string, filename: string): void => {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

