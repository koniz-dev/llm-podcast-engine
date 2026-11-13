const MAX_SOURCE_CHARACTERS = 20_000

export type SourceCollection = {
  sourceMaterial: string
  usedSources: string[]
  failedSources: string[]
}

export function collectSourceMaterial(
  urls: string[],
  results: PromiseSettledResult<string>[],
): SourceCollection {
  const perSourceLimit = Math.floor(MAX_SOURCE_CHARACTERS / Math.max(urls.length, 1))
  const usedSources: string[] = []
  const failedSources: string[] = []
  const sections: string[] = []

  urls.forEach((url, index) => {
    const result = results[index]
    if (!result || result.status === "rejected" || !result.value.trim()) {
      failedSources.push(url)
      return
    }
    usedSources.push(url)
    sections.push(`\n\nSource URL: ${url}\n<source>${result.value.slice(0, perSourceLimit)}</source>`)
  })

  return { sourceMaterial: sections.join(""), usedSources, failedSources }
}
