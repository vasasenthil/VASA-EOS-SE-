import { test } from "node:test"
import assert from "node:assert/strict"
import { ASSETS, assetTag, assetSummary, type Asset } from "@/lib/assets"

test("assetTag is zero-padded", () => {
  assert.equal(assetTag(1), "AST-000001")
  assert.equal(assetTag(123), "AST-000123")
})

test("summary tallies conditions and needs-attention = poor + unusable", () => {
  const s = assetSummary(ASSETS)
  assert.equal(s.total, ASSETS.length)
  assert.equal(
    s.byCondition.good + s.byCondition.fair + s.byCondition.poor + s.byCondition.unusable,
    ASSETS.length,
  )
  assert.equal(s.needsAttention, s.byCondition.poor + s.byCondition.unusable)
})

test("a fully-good register needs no attention", () => {
  const good: Asset[] = [{ id: "x", tag: assetTag(9), name: "n", category: "ICT", location: "l", condition: "good" }]
  assert.equal(assetSummary(good).needsAttention, 0)
})
