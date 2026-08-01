import { readFileSync } from "node:fs"
import { test } from "node:test"
import assert from "node:assert/strict"

test("generated production acceptance manifest is a custody-ready hash ledger", () => {
  const manifest = JSON.parse(readFileSync("docs/generated/production-acceptance-manifest.json", "utf8"))
  assert.equal(manifest.algorithm, "sha256")
  assert.equal(manifest.custodyOwner, "CISO Office")
  assert.equal(manifest.reviewCadence, "per-release")
  assert.equal(manifest.retentionClass, "sovereign-production-acceptance")
  assert.ok(manifest.artifacts.length >= 4)
  assert.ok(manifest.artifacts.some((artifact: { id: string; path: string }) => artifact.id === "acceptance-pack-markdown" && artifact.path === "/api/governance/acceptance-pack/markdown"))
  assert.ok(manifest.artifacts.some((artifact: { id: string; path: string }) => artifact.id === "inventory-ledger-csv" && artifact.path === "/api/governance/inventory-ledger/csv"))
  for (const artifact of manifest.artifacts as Array<{ sha256: string; bytes: number }>) {
    assert.match(artifact.sha256, /^[a-f0-9]{64}$/)
    assert.ok(artifact.bytes > 0)
  }
})

test("acceptance pack markdown and manifest share the same generation timestamp", () => {
  const markdown = readFileSync("docs/generated/production-acceptance-pack.md", "utf8")
  const manifest = JSON.parse(readFileSync("docs/generated/production-acceptance-manifest.json", "utf8"))
  assert.match(markdown, new RegExp(`Generated: ${manifest.generatedAt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`))
})
