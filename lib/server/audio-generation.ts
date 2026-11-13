export async function synthesizeIfRequested(
  audioRequested: boolean,
  synthesize: () => Promise<Buffer>,
): Promise<Buffer | undefined> {
  if (!audioRequested) return undefined
  return synthesize()
}
