import { test } from "node:test"
import assert from "node:assert/strict"
import {
  SCREENINGS,
  WELLBEING_DOMAINS,
  MAX_PER_DOMAIN,
  totalScore,
  band,
  topConcern,
  referrals,
  mentalHealthSummary,
  toCSV,
} from "@/lib/health/mental-health"

test("screenings are well-formed: one score per domain, within range", () => {
  for (const s of SCREENINGS) {
    assert.equal(s.scores.length, WELLBEING_DOMAINS.length)
    assert.ok(s.scores.every((v) => v >= 0 && v <= MAX_PER_DOMAIN))
  }
})

test("banding thresholds place students correctly", () => {
  const well = SCREENINGS.find((s) => s.studentId === "S-9005")! // total 2
  const refer = SCREENINGS.find((s) => s.studentId === "S-9004")! // total 20
  assert.equal(band(well), "well")
  assert.equal(band(refer), "refer")
  assert.ok(totalScore(refer) > 12)
})

test("top concern is the highest-scoring domain", () => {
  const s = SCREENINGS.find((x) => x.studentId === "S-9002")! // exam pressure = 4 (highest)
  assert.equal(topConcern(s), "Exam pressure")
})

test("referrals lists only 'refer' students, highest score first", () => {
  const refs = referrals()
  assert.ok(refs.every((s) => band(s) === "refer"))
  for (let i = 1; i < refs.length; i++) assert.ok(totalScore(refs[i - 1]) >= totalScore(refs[i]))
  assert.ok(refs.some((s) => s.studentId === "S-9004"))
})

test("summary tallies bands, average and the cohort's top concern", () => {
  const s = mentalHealthSummary()
  assert.equal(s.screened, SCREENINGS.length)
  assert.equal(s.well + s.monitor + s.refer, s.screened)
  assert.ok(s.avgScore > 0)
  assert.ok((WELLBEING_DOMAINS as readonly string[]).includes(s.topCohortConcern))
})

test("CSV has a header plus one row per screening", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Student,Grade,Total,Band,Top concern")
  assert.equal(lines.length, SCREENINGS.length + 1)
})
