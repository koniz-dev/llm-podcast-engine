type LogLevel = "info" | "warn" | "error"
type LogFields = Record<string, unknown>

function write(level: LogLevel, event: string, fields: LogFields = {}) {
  const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...fields,
  })

  if (level === "error") console.error(payload)
  else if (level === "warn") console.warn(payload)
  else console.info(payload)
}

export const logger = {
  info: (event: string, fields?: LogFields) => write("info", event, fields),
  warn: (event: string, fields?: LogFields) => write("warn", event, fields),
  error: (event: string, fields?: LogFields) => write("error", event, fields),
}

export function serializeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack }
  }
  return { message: String(error) }
}
