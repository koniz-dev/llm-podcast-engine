# Local fallback

Use this only after agent-native capabilities are insufficient and an existing checkout is available. Verify the checkout by confirming `package.json` has the name `llm-podcast-engine`. Do not start Next.js.

The CLI reads `.env` and then `.env.local` from the repository root, without printing values. Existing process environment variables take precedence.

Transcript generation requires the checkout's configured scraping and language-model providers:

- `FIRECRAWL_API_KEY`
- `GROQ_API_KEY`

Audio or voice listing additionally requires `ELEVENLABS_API_KEY`. Transcript-only mode does not require it. Optional provider settings are `GROQ_BASE_URL`, `LLM_MODEL`, and `ELEVENLABS_MODEL_ID`.

Commands:

```bash
npm run podcast -- --url "https://example.com/article"
npm run podcast -- --url "https://example.com/a" --url "https://example.com/b" --language Vietnamese --style "calm science host" --duration 3
npm run podcast -- --url "https://example.com/article" --audio --voice "Adam" --output-dir "output/podcasts"
npm run podcast -- --list-voices
```

The command emits JSON containing absolute transcript/audio paths and the used/failed source lists. Never read, print, copy, transmit, or commit provider keys.
