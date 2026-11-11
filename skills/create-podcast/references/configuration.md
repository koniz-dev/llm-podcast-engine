# Local configuration

The CLI reads `.env` followed by `.env.local` from the repository root. Existing process environment variables take precedence.

Required for scripts:

- `FIRECRAWL_API_KEY`
- `GROQ_API_KEY`

Required only for voice listing and MP3 generation:

- `ELEVENLABS_API_KEY`

Optional defaults:

- `GROQ_BASE_URL=https://api.groq.com/openai/v1`
- `LLM_MODEL=openai/gpt-oss-20b`
- `ELEVENLABS_MODEL_ID=eleven_turbo_v2_5`

Common failures:

- `voices_read`: enable voice read permission on the ElevenLabs key, or provide a known voice ID.
- HTTP 402 during synthesis: the ElevenLabs account lacks sufficient character quota.
- Empty scrape: use a direct public article URL instead of a homepage or authenticated page.
- Missing executable: run `npm install` in the checkout, then retry the CLI once.
