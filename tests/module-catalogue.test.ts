import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  CATALOGUE_MODULES,
  CATALOGUE_TOTAL_MODULES,
  MODULE_TIERS,
  byTier,
  byStatus,
  coverageByTier,
  catalogueSummary,
  toCSV,
} from "@/lib/governance/module-catalogue"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("every catalogue tier is represented", () => {
  for (const tier of MODULE_TIERS) {
    assert.ok(byTier(tier).length >= 1, `tier ${tier} has no mapped modules`)
  }
})

test("built/partial modules cite real repo evidence; pending cite nothing (no overstatement)", () => {
  for (const m of CATALOGUE_MODULES) {
    if (m.status === "pending") {
      assert.equal(m.repoRef, "", `${m.name} is pending but cites a repo ref`)
    } else {
      assert.notEqual(m.repoRef, "", `${m.name} claims ${m.status} but cites no evidence`)
      assert.ok(existsSync(join(repoRoot, m.repoRef)), `${m.name} → missing evidence ${m.repoRef}`)
    }
  }
})

test("the map honestly discloses pending catalogue modules", () => {
  assert.ok(byStatus("pending").length >= 1, "real gaps must be disclosed")
  const pendingNames = byStatus("pending").map((m) => m.name)
  assert.ok(pendingNames.some((n) => /Legal Case|Event Bus|API Gateway|Encryption/.test(n)))
})

test("per-tier coverage sums and builtPct compute correctly", () => {
  const cov = coverageByTier()
  assert.equal(cov.length, MODULE_TIERS.length)
  for (const c of cov) {
    assert.equal(c.built + c.partial + c.pending, c.modules)
    assert.equal(c.builtPct, c.modules === 0 ? 0 : Math.round((c.built / c.modules) * 100))
  }
})

test("summary keeps catalogue context and weights coverage honestly", () => {
  const s = catalogueSummary()
  assert.equal(s.catalogueTotal, CATALOGUE_TOTAL_MODULES)
  assert.equal(s.mapped, CATALOGUE_MODULES.length)
  assert.equal(s.built + s.partial + s.pending, s.mapped)
  assert.equal(s.coveragePct, Math.round(((s.built + s.partial * 0.5) / s.mapped) * 100))
  assert.ok(s.mapped < s.catalogueTotal, "honest: this maps a representative subset, not all 312")
})

test("CSV has a header plus one row per mapped module", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Tier,Module,Repo evidence,Status")
  assert.equal(lines.length, CATALOGUE_MODULES.length + 1)
})
