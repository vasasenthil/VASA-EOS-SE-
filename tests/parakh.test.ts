import { test } from "node:test"
import assert from "node:assert/strict"
import {
  PARAKH_RESULTS,
  PROFICIENCY_LEVELS,
  assessed,
  proficientPct,
  belowBasicPct,
  parakhSummary,
  toCSV,
} from "@/lib/diagnostic/parakh"

test("results have one count per proficiency level", () => {
  for (const r of PARAKH_RESULTS) {
    assert.equal(r.distribution.length, PROFICIENCY_LEVELS.length)
    assert.ok(r.distribution.every((n) => n >= 0))
  }
})

test("proficiency = Proficient + Advanced; below-basic is the first band", () => {
  const langG3 = PARAKH_RESULTS.find((r) => r.subject === "Language" && r.grade === 3)! // [40,100,160,100]=400
  assert.equal(assessed(langG3), 400)
  assert.equal(proficientPct(langG3), 65) // (160+100)/400
  assert.equal(belowBasicPct(langG3), 10) // 40/400
})

test("summary identifies the weakest and strongest subjects", () => {
  const s = parakhSummary()
  assert.equal(s.results, PARAKH_RESULTS.length)
  assert.equal(s.totalAssessed, PARAKH_RESULTS.reduce((n, r) => n + assessed(r), 0))
  assert.equal(s.weakest, "Mathematics (Grade 8)") // lowest proficiency (35%)
  assert.equal(s.strongest, "Language (Grade 3)") // highest (65%)
  assert.ok(s.avgProficiencyPct > 0 && s.avgProficiencyPct <= 100)
})

test("empty input yields a zeroed summary", () => {
  const s = parakhSummary([])
  assert.equal(s.results, 0)
  assert.equal(s.avgProficiencyPct, 0)
})

test("CSV has a header plus one row per result", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Subject,Grade,Assessed,Below Basic %,Proficiency %")
  assert.equal(lines.length, PARAKH_RESULTS.length + 1)
})
