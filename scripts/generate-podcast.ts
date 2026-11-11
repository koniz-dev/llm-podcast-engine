import { randomUUID } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { ElevenLabsClient } from "elevenlabs"
import type { ServerConfig } from "../lib/server/config"
import { createPodcastProviders } from "../lib/server/providers"
import { isSafePublicUrl, MAX_URLS } from "../lib/server/request-validation"

const MAX_SOURCE_CHARACTERS = 20_000

type CliOptions = {
  urls: string[]
  voice?: string
  outputDirectory: string
  scriptOnly: boolean
  listVoices: boolean
  durationMinutes: number
  language: string
  style: string
}

function printHelp() {
  console.log(`Create a local podcast without starting the web app.

Usage:
  npm run podcast -- --url <url> [--url <url>] [options]
  npm run podcast -- --list-voices

Options:
  --url <url>            Public article URL. Repeat up to ${MAX_URLS} times.
  --voice <name-or-id>   ElevenLabs voice name or ID. Defaults to the first premade voice.
  --duration <minutes>   Target length from 1 to 10 minutes (default: 5).
  --language <language>  Spoken language (default: English).
  --style <description>  Host tone (default: witty, accurate tech-news).
  --output-dir <path>    Destination directory (default: output/podcasts).
  --script-only          Write the transcript without using ElevenLabs quota.
  --list-voices          Print available ElevenLabs voices and exit.
  --help                 Show this help.`)
}

function takeValue(args: string[], index: number, flag: string) {
  const value = args[index + 1]
  if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value`)
  return value
}

export function parseCliArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    urls: [],
    outputDirectory: "output/podcasts",
    scriptOnly: false,
    listVoices: false,
    durationMinutes: 5,
    language: "English",
    style: "witty, accurate tech-news",
  }

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (argument === "--url") options.urls.push(takeValue(args, index++, argument))
    else if (argument === "--voice") options.voice = takeValue(args, index++, argument)
    else if (argument === "--output-dir") options.outputDirectory = takeValue(args, index++, argument)
    else if (argument === "--language") options.language = takeValue(args, index++, argument)
    else if (argument === "--style") options.style = takeValue(args, index++, argument)
    else if (argument === "--duration") {
      const value = Number(takeValue(args, index++, argument))
      if (!Number.isInteger(value) || value < 1 || value > 10) throw new Error("--duration must be an integer from 1 to 10")
      options.durationMinutes = value
    } else if (argument === "--script-only") options.scriptOnly = true
    else if (argument === "--list-voices") options.listVoices = true
    else if (argument === "--help" || argument === "-h") {
      printHelp()
      process.exit(0)
    } else if (!argument.startsWith("--")) options.urls.push(argument)
    else throw new Error(`Unknown option: ${argument}`)
  }

  options.urls = [...new Set(options.urls.map((url) => url.trim()).filter(Boolean))]
  if (!options.listVoices && options.urls.length === 0) throw new Error("Provide at least one --url")
  if (options.urls.length > MAX_URLS) throw new Error(`At most ${MAX_URLS} URLs are allowed`)
  const invalidUrl = options.urls.find((url) => !isSafePublicUrl(url))
  if (invalidUrl) throw new Error(`Only public HTTP(S) URLs are allowed: ${invalidUrl}`)
  if (!options.language.trim() || options.language.length > 64) throw new Error("--language must be 1 to 64 characters")
  if (!options.style.trim() || options.style.length > 120) throw new Error("--style must be 1 to 120 characters")
  return options
}

function loadEnvironment(rootDirectory: string) {
  const inheritedVariables = new Set(Object.keys(process.env))
  for (const fileName of [".env", ".env.local"]) {
    const filePath = path.join(rootDirectory, fileName)
    if (!existsSync(filePath)) continue
    for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!match || match[2] === undefined || inheritedVariables.has(match[1])) continue
      let value = match[2].trim()
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      process.env[match[1]] = value
    }
  }
}

function requiredEnvironment(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is missing. Add it to .env.local.`)
  return value
}

function createCliConfig(scriptOnly: boolean): ServerConfig {
  return {
    FIRECRAWL_API_KEY: requiredEnvironment("FIRECRAWL_API_KEY"),
    GROQ_API_KEY: requiredEnvironment("GROQ_API_KEY"),
    GROQ_BASE_URL: process.env.GROQ_BASE_URL?.trim() || "https://api.groq.com/openai/v1",
    LLM_MODEL: process.env.LLM_MODEL?.trim() || "openai/gpt-oss-20b",
    ELEVENLABS_API_KEY: scriptOnly ? process.env.ELEVENLABS_API_KEY?.trim() || "unused" : requiredEnvironment("ELEVENLABS_API_KEY"),
    ELEVENLABS_MODEL_ID: process.env.ELEVENLABS_MODEL_ID?.trim() || "eleven_turbo_v2_5",
    AUDIO_STORAGE_MODE: "local",
    BLOB_READ_WRITE_TOKEN: undefined,
  }
}

async function getVoices(apiKey: string) {
  const response = await new ElevenLabsClient({ apiKey }).voices.getAll()
  return response.voices
    .filter((voice) => voice.voice_id && voice.name)
    .map((voice) => ({ id: voice.voice_id, name: voice.name!, category: voice.category || "custom" }))
    .sort((left, right) => left.name.localeCompare(right.name))
}

async function resolveVoice(apiKey: string, requested?: string) {
  if (requested && /^[A-Za-z0-9_-]{10,}$/.test(requested)) return { id: requested, name: requested }
  const voices = await getVoices(apiKey)
  if (voices.length === 0) throw new Error("ElevenLabs returned no available voices")
  if (!requested) {
    const selected = voices.find((voice) => voice.category === "premade") || voices[0]
    return { id: selected.id, name: selected.name }
  }

  const normalized = requested.toLowerCase()
  const exact = voices.find((voice) => voice.name.toLowerCase() === normalized)
  if (exact) return { id: exact.id, name: exact.name }
  const partial = voices.filter((voice) => voice.name.toLowerCase().includes(normalized))
  if (partial.length === 1) return { id: partial[0].id, name: partial[0].name }
  if (partial.length > 1) throw new Error(`Voice name is ambiguous: ${partial.map((voice) => voice.name).join(", ")}`)
  throw new Error(`Voice not found: ${requested}. Run with --list-voices.`)
}

function currentDate() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date())
}

function outputStem() {
  return `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`
}

async function main() {
  const rootDirectory = process.cwd()
  loadEnvironment(rootDirectory)
  const options = parseCliArgs(process.argv.slice(2))

  if (options.listVoices) {
    const voices = await getVoices(requiredEnvironment("ELEVENLABS_API_KEY"))
    console.log(JSON.stringify({ voices }, null, 2))
    return
  }

  const config = createCliConfig(options.scriptOnly)
  const providers = createPodcastProviders(config)
  const abortController = new AbortController()
  process.once("SIGINT", () => abortController.abort())

  console.error(`Scraping ${options.urls.length} source(s)...`)
  const scrapeResults = await Promise.allSettled(options.urls.map((url) => providers.scrape(url)))
  const perSourceLimit = Math.floor(MAX_SOURCE_CHARACTERS / options.urls.length)
  const sourceMaterial = scrapeResults.map((result, index) => {
    if (result.status === "rejected" || !result.value) return ""
    return `\n\nSource URL: ${options.urls[index]}\n<source>${result.value.slice(0, perSourceLimit)}</source>`
  }).filter(Boolean).join("")
  if (!sourceMaterial) throw new Error("No content could be scraped from the supplied URLs")

  const failedSources = scrapeResults.filter((result) => result.status === "rejected").length
  if (failedSources > 0) console.error(`Continuing without ${failedSources} failed source(s).`)
  console.error(`Writing a ${options.durationMinutes}-minute ${options.language} script...`)
  const script = await providers.streamScript(
    sourceMaterial,
    currentDate(),
    abortController.signal,
    () => {},
    { durationMinutes: options.durationMinutes, language: options.language, style: options.style },
  )
  if (!script.trim()) throw new Error("The language model returned an empty script")

  const destination = path.resolve(rootDirectory, options.outputDirectory)
  await mkdir(destination, { recursive: true })
  const stem = outputStem()
  const transcriptPath = path.join(destination, `${stem}.txt`)
  await writeFile(transcriptPath, script.trim() + "\n", "utf8")

  if (options.scriptOnly) {
    console.log(JSON.stringify({ mode: "script-only", transcriptPath, scriptCharacters: script.length }, null, 2))
    return
  }

  const voice = await resolveVoice(config.ELEVENLABS_API_KEY, options.voice)
  console.error(`Synthesizing audio with ${voice.name}...`)
  const audio = await providers.synthesize(script, voice.id, abortController.signal)
  const audioPath = path.join(destination, `${stem}.mp3`)
  await writeFile(audioPath, audio)
  console.log(JSON.stringify({
    mode: "audio",
    voice: voice.name,
    transcriptPath,
    audioPath,
    scriptCharacters: script.length,
    audioBytes: audio.byteLength,
  }, null, 2))
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Podcast generation failed: ${message}`)
  process.exitCode = 1
})
