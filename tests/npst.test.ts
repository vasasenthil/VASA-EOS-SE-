import { test } from "node:test"
import assert from "node:assert/strict"
import {
  CAREER_STAGES,
  SAMPLE_PROFILE,
  gap,
  developmentAreas,
  competencyPct,
  readyToProgress,
  npstSummary,
  toCSV,
} from "@/lib/cpd/npst"

test("the profile is well-formed against a valid career stage", () => {
  assert.ok((CAREER_STAGES as readonly string[]).includes(SAMPLE_PROFILE.targetStage))
  for (const d of SAMPLE_PROFILE.domains) {
    assert.ok(d.current >= 1 && d.current <= 5)
    assert.ok(d.expected >= 1 && d.expected <= 5)
  }
})

test("gap and development areas derive from current vs expected", () => {
  const ict = SAMPLE_PROFILE.domains.find((d) => d.key === "ict")! // 2 vs 3 → gap 1
  assert.equal(gap(ict), 1)
  const ethics = SAMPLE_PROFILE.domains.find((d) => d.key === "ethics")! // 5 vs 4 → no gap
  assert.equal(gap(ethics), 0)
  const areas = developmentAreas()
  assert.ok(areas.every((d) => d.current < d.expected))
  for (let i = 1; i < areas.length; i++) assert.ok(gap(areas[i - 1]) >= gap(areas[i])) // largest gap first
})

test("competency percentage and progression readiness", () => {
  // currents: 4+3+3+4+5+2 = 21 of 30 → 70%
  assert.equal(competencyPct(), 70)
  // not ready: pedagogy/assessment/ict are below expected
  assert.equal(readyToProgress(), false)
})

test("summary tallies domains, competency and development areas", () => {
  const s = npstSummary()
  assert.equal(s.domains, SAMPLE_PROFILE.domains.length)
  assert.equal(s.competencyPct, 70)
  assert.equal(s.atOrAboveExpected + s.developmentAreas, s.domains)
  assert.equal(s.readyToProgress, false)
  assert.equal(s.targetStage, "Expert")
})

test("CSV has a header plus one row per domain", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Domain,Current,Expected,Gap")
  assert.equal(lines.length, SAMPLE_PROFILE.domains.length + 1)
})
