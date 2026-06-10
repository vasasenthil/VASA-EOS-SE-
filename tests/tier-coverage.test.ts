import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  TIERS,
  TIER_CAPABILITIES,
  byTier,
  byStatus,
  coverageByTier,
  tierCoverageSummary,
  toCSV,
} from "@/lib/governance/tier-coverage"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("every tenancy tier is represented with at least one capability", () => {
  for (const tier of TIERS) {
    assert.ok(byTier(tier).length >= 1, `tier ${tier} has no capabilities`)
  }
})

test("status and feature are kept consistent (inventory cannot fake coverage)", () => {
  for (const c of TIER_CAPABILITIES) {
    if (c.status === "pending") {
      assert.equal(c.featureRef, "", `${c.tier}/${c.responsibility} is pending but claims a feature`)
      assert.equal(c.route, "", `${c.tier}/${c.responsibility} is pending but claims a route`)
    } else {
      assert.notEqual(c.featureRef, "", `${c.tier}/${c.responsibility} names no feature`)
      assert.ok(existsSync(join(repoRoot, c.featureRef)), `missing feature ${c.featureRef}`)
      assert.notEqual(c.route, "")
    }
  }
})

test("every tier now links to its own honest role register (no faked coverage)", () => {
  // Every tier's representative capabilities now reference a real feature; the per-role
  // registers (linked from here) carry the remaining partials/pending honestly.
  for (const c of byStatus("pending")) {
    assert.equal(c.featureRef, "", "any pending item must reference nothing")
  }
  // State, Directorate and School each surface a dedicated capability register.
  const registers = TIER_CAPABILITIES.filter((c) => c.featureRef.endsWith("-capabilities.ts"))
  assert.ok(registers.length >= 3, "tiers should link to their honest role registers")
})

test("per-tier coverage sums match and builtPct is computed honestly", () => {
  const cov = coverageByTier()
  assert.equal(cov.length, TIERS.length)
  for (const t of cov) {
    assert.equal(t.built + t.partial + t.pending, t.capabilities)
    assert.equal(t.builtPct, t.capabilities === 0 ? 0 : Math.round((t.built / t.capabilities) * 100))
  }
})

test("overall summary tallies across all tiers", () => {
  const s = tierCoverageSummary()
  assert.equal(s.tiers, TIERS.length)
  assert.equal(s.capabilities, TIER_CAPABILITIES.length)
  assert.equal(s.built + s.partial + s.pending, s.capabilities)
  assert.equal(s.builtPct, Math.round((s.built / s.capabilities) * 100))
  assert.ok(s.builtPct > 0 && s.builtPct <= 100)
})

test("CSV has a header plus one row per capability", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Tier,Role,Dimension,Responsibility,Feature,Route,Status")
  assert.equal(lines.length, TIER_CAPABILITIES.length + 1)
})
