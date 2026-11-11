import { cp, mkdir } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import process from "node:process"

const repositoryRoot = process.cwd()
const source = path.join(repositoryRoot, "skills", "create-podcast")
const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), ".codex")
const destination = path.join(codexHome, "skills", "create-podcast")

await mkdir(path.dirname(destination), { recursive: true })
await cp(source, destination, { recursive: true, force: true })
console.log(`Installed create-podcast skill to ${destination}`)
