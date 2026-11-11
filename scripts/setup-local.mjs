import { copyFile, access } from "node:fs/promises"
import { constants } from "node:fs"
import path from "node:path"

const projectRoot = process.cwd()
const examplePath = path.join(projectRoot, ".env.example")
const localPath = path.join(projectRoot, ".env.local")

try {
  await access(localPath, constants.F_OK)
  console.log(".env.local already exists; nothing was overwritten.")
} catch {
  await copyFile(examplePath, localPath)
  console.log("Created .env.local from .env.example.")
}

console.log("Add your Firecrawl, Groq, and ElevenLabs API keys, then run: bun dev")
