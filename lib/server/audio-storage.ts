import { put } from "@vercel/blob"
import { mkdir, readdir, stat, unlink, writeFile } from "node:fs/promises"
import path from "node:path"
import type { ServerConfig } from "./config"
import { logger } from "./logger"

export interface StoredAudio {
  key: string
  url: string
}

export interface AudioStorage {
  save(audio: Buffer, requestId: string): Promise<StoredAudio>
}

const LOCAL_RETENTION_MS = 24 * 60 * 60 * 1_000

function createFileName(requestId: string) {
  return `${new Date().toISOString().replace(/[:.]/g, "-")}-${requestId}.mp3`
}

async function cleanupLocalFiles(directory: string) {
  const cutoff = Date.now() - LOCAL_RETENTION_MS
  const fileNames = await readdir(directory)
  await Promise.all(fileNames.filter((name) => name.endsWith(".mp3")).map(async (name) => {
    const filePath = path.join(directory, name)
    const fileStat = await stat(filePath)
    if (fileStat.mtimeMs < cutoff) await unlink(filePath)
  }))
}

class LocalAudioStorage implements AudioStorage {
  async save(audio: Buffer, requestId: string): Promise<StoredAudio> {
    const directory = path.join(process.cwd(), "public", "generated")
    const fileName = createFileName(requestId)
    await mkdir(directory, { recursive: true })
    await writeFile(path.join(directory, fileName), audio)
    cleanupLocalFiles(directory).catch((error) => {
      logger.warn("audio.local_cleanup_failed", { message: error instanceof Error ? error.message : String(error) })
    })
    return { key: fileName, url: `/generated/${fileName}` }
  }
}

class VercelBlobAudioStorage implements AudioStorage {
  constructor(private readonly token: string) {}

  async save(audio: Buffer, requestId: string): Promise<StoredAudio> {
    const key = `podcasts/${createFileName(requestId)}`
    const blob = await put(key, audio, {
      access: "public",
      contentType: "audio/mpeg",
      token: this.token,
      addRandomSuffix: false,
    })
    return { key, url: blob.url }
  }
}

export function createAudioStorage(config: ServerConfig): AudioStorage {
  if (config.AUDIO_STORAGE_MODE === "vercel-blob") {
    return new VercelBlobAudioStorage(config.BLOB_READ_WRITE_TOKEN!)
  }

  if (process.env.NODE_ENV === "production") {
    logger.warn("audio.local_storage_in_production", {
      message: "Generated audio may not persist. Configure AUDIO_STORAGE_MODE=vercel-blob.",
    })
  }
  return new LocalAudioStorage()
}
