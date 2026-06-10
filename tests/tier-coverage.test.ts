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

test("the inventory honestly discloses where tiers still lack a dedicated register", () => {
  // We have NOT yet built Director/School honest-coverage registers — they must show as pending.
  assert.ok(byStatus("pending").length >= 1, "real gaps must be disclosed")
  const pendingTiers = new Set(byStatus("pending").map((c) => c.tier))
  assert.ok(pendingTiers.has("Directorate") && pendingTiers.has("School"))
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
  assert.ok(s.builtPct > 0 && s.builtPct < 100, "honest: broad coverage, not total")
})

test("CSV has a header plus one row per capability", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Tier,Role,Dimension,Responsibility,Feature,Route,Status")
  assert.equal(lines.length, TIER_CAPABILITIES.length + 1)
})
