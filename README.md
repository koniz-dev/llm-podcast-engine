# LLM Podcast Engine

An AI-powered podcast generation engine that scrapes content from URLs, generates witty tech news scripts using LLM, and converts them to high-quality audio using text-to-speech technology.

> [!IMPORTANT]
> This project began as an independently written implementation created while
> following Developers Digest's [Build AI Podcasts from Any Site](https://youtu.be/ievgM928RBc)
> tutorial and its [original reference repository](https://github.com/developersdigest/llm-podcast-engine).
> It has since continued as an independently developed project. It is not a fork,
> an official continuation, or affiliated with or endorsed by Developers Digest.
> See [NOTICE.md](NOTICE.md) for full attribution and project provenance.

## Features

- 🔍 **Web Scraping**: Automatically scrapes and extracts content from multiple URLs using Firecrawl
- 🤖 **AI Script Generation**: Uses Groq's LLM (Llama models) to generate entertaining and witty podcast scripts
- 🎙️ **Text-to-Speech**: Converts scripts to natural-sounding audio using ElevenLabs
- 🎨 **Modern UI**: Beautiful, responsive interface built with Next.js, Tailwind CSS, and Framer Motion
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🎵 **Audio Player**: Built-in audio player with play/pause and download functionality
- 🔄 **Real-time Streaming**: Live updates during podcast generation process
- 🎭 **Voice Selection**: Choose from multiple ElevenLabs voices
- 🧩 **Portable agent skill + CLI**: Prefer built-in agent tools, with the repository CLI as a local fallback

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI, shadcn/ui
- **Animations**: Framer Motion
- **LLM**: Groq API (Llama 3.1/3.3 models)
- **Web Scraping**: Firecrawl
- **Text-to-Speech**: ElevenLabs
- **State Management**: React Hooks
- **Notifications**: Sonner

## Prerequisites

- Node.js 20.9+ or Bun 1.3+
- Local provider keys for [Groq](https://console.groq.com/) and [Firecrawl](https://www.firecrawl.dev/)
- An [ElevenLabs](https://elevenlabs.io/) key only when using local voice listing or MP3 generation

The portable skill does not require these local providers when the agent environment already has equivalent URL-reading and text-to-speech capabilities.

## Installation

1. Clone the repository:
```bash
git clone https://github.com/koniz-dev/llm-podcast-engine.git
cd llm-podcast-engine
```

2. Install dependencies:
```bash
npm install
# or
bun install
```

3. Create a `.env.local` file in the root directory:
```env
GROQ_API_KEY=your_groq_api_key
GROQ_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=openai/gpt-oss-20b
FIRECRAWL_API_KEY=your_firecrawl_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_MODEL_ID=eleven_turbo_v2_5
AUDIO_STORAGE_MODE=local
# Required only when AUDIO_STORAGE_MODE=vercel-blob
BLOB_READ_WRITE_TOKEN=
```

4. Run the development server:
```bash
npm run dev
# or
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GROQ_API_KEY` | Your Groq API key for LLM access | - | Yes |
| `GROQ_BASE_URL` | Groq API base URL | `https://api.groq.com/openai/v1` | No |
| `LLM_MODEL` | Groq model used for script generation | `openai/gpt-oss-20b` | No |
| `FIRECRAWL_API_KEY` | Firecrawl API key for web scraping | - | Yes |
| `ELEVENLABS_API_KEY` | ElevenLabs API key for TTS | - | Only for voice listing or audio |
| `ELEVENLABS_MODEL_ID` | ElevenLabs model ID | `eleven_turbo_v2_5` | No |
| `AUDIO_STORAGE_MODE` | `local` for development or `vercel-blob` for durable storage | `local` | No |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read/write token | - | Only for `vercel-blob` |

### Available LLM Models

Groq provides several models with different characteristics:

- **openai/gpt-oss-20b**: Fast default suitable for local development and the Groq free tier
- **openai/gpt-oss-120b**: Higher quality, with a larger resource footprint
- Check Groq's current model list before choosing another model; model IDs can be retired over time

## Usage

### Agent skill and local CLI

The versioned skill in `skills/create-podcast` accepts 1–5 public article URLs. It first uses available agent-native URL reading, language-model, and text-to-speech capabilities. It does not require a checkout or local API keys in that mode. When those capabilities are unavailable, it can use this checkout's CLI without starting Next.js.

Transcript is the safe, no-TTS default:

```bash
# Create a transcript without using ElevenLabs quota
npm run podcast -- --url "https://example.com/article"

# Combine sources with presentation controls
npm run podcast -- --url "https://example.com/a" --url "https://example.com/b" --duration 3 --language Vietnamese --style "calm science host"

# Explicitly request a short Vietnamese MP3 with a named voice
npm run podcast -- --url "https://example.com/article" --audio --voice "Adam" --duration 2 --language Vietnamese

# Inspect available voices
npm run podcast -- --list-voices
```

The CLI accepts `--output-dir <path>` and emits JSON with absolute file paths plus used and failed source lists. Outputs default to `output/podcasts` and are ignored by Git. Failed individual URLs do not stop generation when another source succeeds.

Install or refresh the personal Codex skill with:

```bash
npm run skill:install
```

### Single URL Mode

1. Select "Single URL" mode
2. Enter a URL (e.g., a news article or blog post)
3. Choose a voice from the dropdown
4. Click "Generate Podcast"
5. Wait for the script to be generated and audio to be created
6. Play the audio or download it

### Multiple URLs Mode

1. Select "Multiple URLs" mode
2. Add URLs using the input field (default URLs are pre-filled)
3. Remove URLs by clicking the X button
4. Choose a voice from the dropdown
5. Click "Generate Podcast"
6. The system will scrape all URLs and create a combined podcast

## Project Structure

```
llm-podcast-engine/
├── app/
│   ├── api/
│   │   ├── generate-podcast/    # Podcast generation API endpoint
│   │   └── voices/               # ElevenLabs voices API endpoint
│   ├── page.tsx                  # Main page component
│   └── layout.tsx                # Root layout
├── components/
│   ├── podcast/                  # Podcast-specific components
│   │   ├── Header.tsx
│   │   ├── UrlInputSection.tsx
│   │   ├── PodcastContentSection.tsx
│   │   └── AudioPlayer.tsx
│   └── ui/                       # Reusable UI components
├── hooks/
│   ├── useAudioPlayer.ts         # Audio player logic
│   └── usePodcastGeneration.ts   # Podcast generation logic
├── lib/
│   ├── podcast.ts                # Podcast utility functions
│   └── utils.ts                  # General utilities
├── constants/
│   └── podcast.ts                # Podcast constants
└── types/
    └── podcast.ts                # TypeScript types
```

## API Endpoints

### POST `/api/generate-podcast`

Generates a podcast from provided URLs.

**Request Body:**
```json
{
  "urls": ["https://example.com/article1", "https://example.com/article2"],
  "voiceId": "voice_id_from_elevenlabs"
}
```

**Response:** Server-Sent Events (SSE) stream with the following message types:
- `update`: Status updates during generation
- `content`: Script content chunks (streamed)
- `complete`: Generation complete with the playable audio URL
- `error`: Error messages

### GET `/api/voices`

Fetches available voices from ElevenLabs.

**Response:**
```json
{
  "voices": [
    {
      "voice_id": "string",
      "name": "string",
      "category": "premade",
      "description": "string"
    }
  ]
}
```

## How It Works

1. **URL Scraping**: The system uses Firecrawl to scrape content from the provided URLs
2. **Content Processing**: Scraped content is combined and formatted
3. **Script Generation**: Groq LLM generates a witty, entertaining podcast script based on the content
4. **Audio Generation**: ElevenLabs converts the script to natural-sounding speech
5. **Streaming**: All steps are streamed to the client for real-time updates

## Development

### First-time local setup

```bash
bun run setup:local
```

For the web app, fill in all three provider keys in `.env.local`, then start it. For transcript-only CLI use, ElevenLabs is not required. The home screen reports missing web-app configuration without exposing secret values.

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Lint

```bash
npm run lint
```

## Troubleshooting

### Audio Generation Fails

- Ensure your ElevenLabs API key is valid and has sufficient credits
- Check that you've selected a voice before generating
- Verify the `ELEVENLABS_MODEL_ID` is correct

### Scraping Fails

- Verify your Firecrawl API key is valid
- Check that the URLs are accessible and not behind paywalls
- Some websites may block scraping - try different URLs

### LLM Generation Fails

- Check your Groq API key and rate limits
- Try switching to a different model if you hit rate limits
- Verify the `GROQ_BASE_URL` is correct

## Contributing

Contributions are welcome! We appreciate your interest in improving the LLM Podcast Engine.

Before contributing, please read our [Contributing Guide](CONTRIBUTING.md) which includes:
- Development setup instructions
- Code style guidelines
- Commit message conventions
- Pull request process
- Areas where contributions are needed

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and test them
4. Commit with clear messages following our conventions
5. Push and create a Pull Request

For detailed information, see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Developers Digest](https://github.com/developersdigest) for the original
  [video tutorial](https://youtu.be/ievgM928RBc) and
  [reference implementation](https://github.com/developersdigest/llm-podcast-engine)
  that inspired and guided the initial implementation of this project
- [Groq](https://groq.com/) for fast LLM inference
- [ElevenLabs](https://elevenlabs.io/) for high-quality text-to-speech
- [Firecrawl](https://www.firecrawl.dev/) for web scraping capabilities
- [Next.js](https://nextjs.org/) for the amazing framework
