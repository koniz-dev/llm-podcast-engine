# LLM Podcast Engine

An AI-powered podcast generation engine that scrapes content from URLs, generates witty tech news scripts using LLM, and converts them to high-quality audio using text-to-speech technology.

## Features

- 🔍 **Web Scraping**: Automatically scrapes and extracts content from multiple URLs using Firecrawl
- 🤖 **AI Script Generation**: Uses Groq's LLM (Llama models) to generate entertaining and witty podcast scripts
- 🎙️ **Text-to-Speech**: Converts scripts to natural-sounding audio using ElevenLabs
- 🎨 **Modern UI**: Beautiful, responsive interface built with Next.js, Tailwind CSS, and Framer Motion
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🎵 **Audio Player**: Built-in audio player with play/pause and download functionality
- 🔄 **Real-time Streaming**: Live updates during podcast generation process
- 🎭 **Voice Selection**: Choose from multiple ElevenLabs voices

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

- Node.js 18+ or Bun
- API keys for:
  - [Groq API](https://console.groq.com/) (for LLM)
  - [Firecrawl](https://www.firecrawl.dev/) (for web scraping)
  - [ElevenLabs](https://elevenlabs.io/) (for text-to-speech)

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
LLM_MODEL=llama-3.1-8b-instant
FIRECRAWL_API_KEY=your_firecrawl_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_MODEL_ID=eleven_turbo_v2_5
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
| `LLM_MODEL` | LLM model to use (see below) | `llama-3.1-8b-instant` | No |
| `FIRECRAWL_API_KEY` | Firecrawl API key for web scraping | - | Yes |
| `ELEVENLABS_API_KEY` | ElevenLabs API key for TTS | - | Yes |
| `ELEVENLABS_MODEL_ID` | ElevenLabs model ID | `eleven_turbo_v2_5` | No |

### Available LLM Models

Groq provides several models with different characteristics:

- **llama-3.1-8b-instant**: Fast, small, best for free tier (recommended)
- **llama-3.1-70b-versatile**: Larger, better quality, may have stricter limits
- **llama-3.3-70b-versatile**: Latest, may have very strict free limits

## Usage

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
- `complete`: Generation complete with audio file name
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

- [Groq](https://groq.com/) for fast LLM inference
- [ElevenLabs](https://elevenlabs.io/) for high-quality text-to-speech
- [Firecrawl](https://www.firecrawl.dev/) for web scraping capabilities
- [Next.js](https://nextjs.org/) for the amazing framework
