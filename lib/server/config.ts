import { z } from "zod"

const emptyAsUndefined = (value: unknown) => value === "" ? undefined : value

const configSchema = z.object({
  FIRECRAWL_API_KEY: z.string().min(1, "FIRECRAWL_API_KEY is required"),
  GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
  GROQ_BASE_URL: z.preprocess(emptyAsUndefined, z.string().url().default("https://api.groq.com/openai/v1")),
  LLM_MODEL: z.preprocess(emptyAsUndefined, z.string().min(1).default("openai/gpt-oss-20b")),
  ELEVENLABS_API_KEY: z.string().min(1, "ELEVENLABS_API_KEY is required"),
  ELEVENLABS_MODEL_ID: z.preprocess(emptyAsUndefined, z.string().min(1).default("eleven_turbo_v2_5")),
  AUDIO_STORAGE_MODE: z.preprocess(emptyAsUndefined, z.enum(["local", "vercel-blob"]).default("local")),
  BLOB_READ_WRITE_TOKEN: z.preprocess(emptyAsUndefined, z.string().optional()),
})

export type ServerConfig = z.infer<typeof configSchema>

const REQUIRED_API_KEYS = ["FIRECRAWL_API_KEY", "GROQ_API_KEY", "ELEVENLABS_API_KEY"] as const

export function getPublicConfigStatus() {
  const missingVariables: string[] = REQUIRED_API_KEYS.filter((key) => !process.env[key]?.trim())
  const storageMode = process.env.AUDIO_STORAGE_MODE || "local"
  if (storageMode === "vercel-blob" && !process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    missingVariables.push("BLOB_READ_WRITE_TOKEN")
  }

  return {
    ready: missingVariables.length === 0,
    missingVariables,
    storageMode,
    model: process.env.LLM_MODEL || "openai/gpt-oss-20b",
  }
}

let cachedConfig: ServerConfig | undefined

export function getServerConfig(): ServerConfig {
  if (cachedConfig) return cachedConfig

  const parsed = configSchema.safeParse(process.env)
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ")
    throw new Error(`Server configuration is invalid: ${details}`)
  }

  if (parsed.data.AUDIO_STORAGE_MODE === "vercel-blob" && !parsed.data.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required when AUDIO_STORAGE_MODE=vercel-blob")
  }

  cachedConfig = parsed.data
  return cachedConfig
}
