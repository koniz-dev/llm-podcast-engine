import { randomUUID } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { ElevenLabsClient } from "elevenlabs"
import { synthesizeIfRequested } from "../lib/server/audio-generation"
import type { ServerConfig } from "../lib/server/config"
import { createPodcastProviders } from "../lib/server/providers"
import { isSafePublicUrl, MAX_URL_LENGTH, MAX_URLS } from "../lib/server/request-validation"
import { collectSourceMaterial } from "../lib/server/source-material"
import { resolveVoice } from "../lib/server/voice-resolution"

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
  --audio                Create an MP3. Without this flag, only a transcript is created.
  --voice <name-or-id>   Voice name or ID for --audio. Defaults to the first premade voice.
  --duration <minutes>   Target length from 1 to 10 minutes (default: 5).
  --language <language>  Spoken language (default: English).
  --style <description>  Host tone (default: witty, accurate tech-news).
  --output-dir <path>    Destination directory (default: output/podcasts).
  --script-only          Write only the transcript (the default; retained for compatibility).
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
    scriptOnly: true,
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
    } else if (argument === "--audio") options.scriptOnly = false
    else if (argument === "--script-only") options.scriptOnly = true
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
  const overlongUrl = options.urls.find((url) => url.length > MAX_URL_LENGTH)
  if (overlongUrl) throw new Error(`URLs must not exceed ${MAX_URL_LENGTH} characters`)
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

export async function getVoices(apiKey: string) {
  const response = await new ElevenLabsClient({ apiKey }).voices.getAll()
  return response.voices
    .filter((voice) => voice.voice_id && voice.name)
    .map((voice) => ({ id: voice.voice_id, name: voice.name!, category: voice.category || "custom" }))
    .sort((left, right) => left.name.localeCompare(right.name))
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

export async function main() {
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
  const scrapeResults = await Promise.allSettled(options.urls.map((url) => providers.scrape(url, abortController.signal)))
  const { sourceMaterial, usedSources, failedSources } = collectSourceMaterial(options.urls, scrapeResults)
  if (!sourceMaterial) throw new Error("No content could be scraped from the supplied URLs")

  if (failedSources.length > 0) console.error(`Continuing without unreadable source(s): ${failedSources.join(", ")}`)
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
    console.log(JSON.stringify({
      mode: "script-only",
      transcriptPath,
      usedSources,
      failedSources,
      scriptCharacters: script.length,
    }, null, 2))
    return
  }

  const voice = await resolveVoice(options.voice, () => getVoices(config.ELEVENLABS_API_KEY))
  console.error(`Synthesizing audio with ${voice.name}...`)
  const audio = await synthesizeIfRequested(!options.scriptOnly, () => (
    providers.synthesize(script, voice.id, abortController.signal)
  ))
  if (!audio) throw new Error("Audio generation was not requested")
  const audioPath = path.join(destination, `${stem}.mp3`)
  await writeFile(audioPath, audio)
  console.log(JSON.stringify({
    mode: "audio",
    voice: voice.name,
    transcriptPath,
    audioPath,
    usedSources,
    failedSources,
    scriptCharacters: script.length,
    audioBytes: audio.byteLength,
  }, null, 2))
}

const entryUrl = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : ""
if (import.meta.url === entryUrl) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`Podcast generation failed: ${message}`)
    process.exitCode = 1
  })
}
