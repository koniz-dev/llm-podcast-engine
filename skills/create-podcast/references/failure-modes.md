# Failure modes

- **One or more unreadable URLs:** continue with readable sources and report each failed URL. Stop only when no source is readable.
- **Unsafe URL:** do not fetch it. Accept only public HTTP(S) article URLs; reject credentials, loopback, link-local, and private-network addresses.
- **Missing agent capability:** state whether public-URL reading or text-to-speech is unavailable. Use local fallback only when its checkout and CLI already exist.
- **Missing local configuration:** name the missing variable without requesting or displaying its value. Transcript mode needs only the scraping and language-model providers; audio also needs the text-to-speech provider.
- **Voice lookup:** a voice ID is used directly. A name must resolve uniquely; otherwise report candidates or suggest local `--list-voices`.
- **Cancellation:** stop further model, synthesis, and file-write steps. Preserve an already written transcript if cancellation occurs during audio generation.
- **Provider error:** report the failing stage and preserve usable outputs. Do not automatically retry text-to-speech; a retry may consume quota.
- **Quota or permission error:** explain which provider capability failed. Do not ask the user to paste a secret into chat.

Local fallback currently uses Firecrawl for retrieval, an OpenAI-compatible Groq endpoint for script generation, and ElevenLabs only for requested MP3 output. These are fallback implementation details, not requirements for agent-native mode.
