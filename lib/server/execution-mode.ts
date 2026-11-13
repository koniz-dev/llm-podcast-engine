export type PodcastEnvironmentCapabilities = {
  canReadPublicUrls: boolean
  canSynthesizeSpeech: boolean
  hasLocalCheckout: boolean
  hasLocalCli: boolean
}

export type PodcastExecutionDecision =
  | { mode: "agent-native"; missing: [] }
  | { mode: "local-fallback"; missing: [] }
  | { mode: "unavailable"; missing: string[] }

export function selectPodcastExecutionMode(
  capabilities: PodcastEnvironmentCapabilities,
  audioRequested: boolean,
): PodcastExecutionDecision {
  const agentNativeReady = capabilities.canReadPublicUrls
    && (!audioRequested || capabilities.canSynthesizeSpeech)
  if (agentNativeReady) return { mode: "agent-native", missing: [] }

  const localReady = capabilities.hasLocalCheckout && capabilities.hasLocalCli
  if (localReady) return { mode: "local-fallback", missing: [] }

  const missing = new Set<string>()
  if (!capabilities.canReadPublicUrls) missing.add("a public-URL reading or scraping capability")
  if (audioRequested && !capabilities.canSynthesizeSpeech) missing.add("a text-to-speech capability")
  if (!capabilities.hasLocalCheckout) missing.add("an llm-podcast-engine checkout")
  else if (!capabilities.hasLocalCli) missing.add("a runnable llm-podcast-engine CLI")
  return { mode: "unavailable", missing: [...missing] }
}
