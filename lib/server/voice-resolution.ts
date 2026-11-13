export type AvailableVoice = {
  id: string
  name: string
  category: string
}

export async function resolveVoice(
  requested: string | undefined,
  loadVoices: () => Promise<AvailableVoice[]>,
) {
  if (requested && /^[A-Za-z0-9_-]{10,}$/.test(requested)) {
    return { id: requested, name: requested }
  }

  const voices = await loadVoices()
  if (voices.length === 0) throw new Error("The text-to-speech provider returned no available voices")
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
