# Quick Start Guide

Get up and running with the LLM Podcast Engine in 5 minutes!

## Step 1: Clone and Install

```bash
git clone <repository-url>
cd llm-podcast-engine
npm install
# or
bun install
```

## Step 2: Get API Keys

You'll need API keys from three services:

1. **Groq** (Free tier available)
   - Sign up at [console.groq.com](https://console.groq.com/)
   - Get your API key from the dashboard

2. **Firecrawl** (Free tier available)
   - Sign up at [firecrawl.dev](https://www.firecrawl.dev/)
   - Get your API key from the dashboard

3. **ElevenLabs** (Free tier available)
   - Sign up at [elevenlabs.io](https://elevenlabs.io/)
   - Get your API key from the dashboard

## Step 3: Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.1-8b-instant
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_MODEL_ID=eleven_turbo_v2_5
```

Replace the placeholder values with your actual API keys.

## Step 4: Run the Development Server

```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 5: Generate Your First Podcast

1. **Select a mode**:
   - Single URL: Enter one URL
   - Multiple URLs: Add multiple URLs (defaults are pre-filled)

2. **Choose a voice**:
   - Click the voice dropdown
   - Select a voice from ElevenLabs

3. **Generate**:
   - Click "Generate Podcast"
   - Watch as the script is generated in real-time
   - Wait for the audio to be created
   - Play or download your podcast!

## Example URLs to Try

- Tech news: `https://techcrunch.com/`
- Hacker News: `https://news.ycombinator.com/`
- The Verge: `https://www.theverge.com/`
- Any article URL from these sites

## Troubleshooting

### "Connection to server failed"
- Make sure the dev server is running
- Check that port 3000 is not in use

### "Please select a voice"
- Make sure you've selected a voice from the dropdown before generating

### "API authentication failed"
- Verify your API keys are correct in `.env.local`
- Make sure there are no extra spaces or quotes
- Restart the dev server after changing `.env.local`

### Audio generation fails
- Check your ElevenLabs API key and credits
- Verify the voice ID is valid

## Next Steps

- Read the [full README](../README.md) for detailed documentation
- Check out the [API documentation](api.md) for integration details
- See [Architecture](architecture.md) for technical details
- Read [Deployment Guide](deployment.md) to deploy your app

## Need Help?

- Check the [troubleshooting section](../README.md#troubleshooting)
- Open an issue on GitHub
- Review the [API documentation](api.md)

Happy podcasting! 🎙️

