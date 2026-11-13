import { describe, expect, test } from "bun:test"
import { collectSourceMaterial } from "../lib/server/source-material"

describe("source collection", () => {
  test("continues after rejected and empty scrape results", () => {
    const urls = ["https://example.com/a", "https://example.com/b", "https://example.com/c"]
    const collection = collectSourceMaterial(urls, [
      { status: "fulfilled", value: "Article A" },
      { status: "rejected", reason: new Error("blocked") },
      { status: "fulfilled", value: "" },
    ])

    expect(collection.sourceMaterial).toContain("Article A")
    expect(collection.usedSources).toEqual([urls[0]])
    expect(collection.failedSources).toEqual([urls[1], urls[2]])
  })
})
