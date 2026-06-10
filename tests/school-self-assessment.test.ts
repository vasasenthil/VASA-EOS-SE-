import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  SQAAF_DOMAINS,
  domainByKey,
  gapToTarget,
  improvementAreas,
  maturityBand,
  sqaafSummary,
  toCSV,
} from "@/lib/governance/school-self-assessment"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("the seven Shaala Siddhi domains are present and well-formed", () => {
  assert.equal(SQAAF_DOMAINS.length, 7)
  const keys = new Set<string>()
  for (const d of SQAAF_DOMAINS) {
    assert.ok(!keys.has(d.key), `duplicate ${d.key}`)
    keys.add(d.key)
    assert.ok(d.name)
    assert.ok(d.level >= 1 && d.level <= 4)
    assert.ok(d.target >= 1 && d.target <= 4)
  }
})

test("every domain cites a real evidence module (self-verifying)", () => {
  for (const d of SQAAF_DOMAINS) {
    assert.ok(existsSync(join(repoRoot, d.evidenceRef)), `${d.key} → missing evidence ${d.evidenceRef}`)
  }
})

test("gap and improvement areas are derived from level vs target", () => {
  const inclusion = domainByKey("inclusion-health-safety")! // level 2, target 4 → gap 2
  assert.equal(gapToTarget(inclusion), 2)
  const leadership = domainByKey("leadership-management")! // level 3, target 3 → at target
  assert.equal(gapToTarget(leadership), 0)
  const areas = improvementAreas()
  assert.ok(areas.every((d) => d.level < d.target))
  // ordered by largest gap first
  for (let i = 1; i < areas.length; i++) assert.ok(gapToTarget(areas[i - 1]) >= gapToTarget(areas[i]))
})

test("maturity band thresholds are correct", () => {
  assert.equal(maturityBand(1.5), "Emerging")
  assert.equal(maturityBand(2.4), "Developing")
  assert.equal(maturityBand(3.2), "Proficient")
  assert.equal(maturityBand(3.8), "Advanced")
})

test("summary computes the average, band and counts honestly", () => {
  const s = sqaafSummary()
  assert.equal(s.domains, SQAAF_DOMAINS.length)
  assert.equal(s.band, maturityBand(s.avgLevel))
  assert.equal(s.atTarget + s.improvementAreas, s.domains)
  assert.ok(s.avgLevel > 0 && s.avgLevel <= 4)
})

test("CSV has a header plus one row per domain", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Domain,Level,Target,Gap,Evidence")
  assert.equal(lines.length, SQAAF_DOMAINS.length + 1)
})
