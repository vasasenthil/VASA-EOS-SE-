import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { assessRisk, type RiskFactors } from "@/lib/dropout"
import { recordDropoutRisk, listDropoutRisk, DEMO_UDISE } from "@/lib/dropout/store"

function low(): RiskFactors {
  return { attendancePct: 96, recentScorePct: 80, feeDefault: false, siblingDropout: false }
}

test("chronic absenteeism plus fee default scores High with named triggers", () => {
  const a = assessRisk({ attendancePct: 60, recentScorePct: 80, feeDefault: true, siblingDropout: false })
  assert.equal(a.band, "High")
  assert.equal(a.score, 55) // 40 (chronic) + 15 (fee), no score penalty
  assert.ok(a.triggers.some((t) => t.startsWith("Chronic absenteeism")))
  assert.ok(a.triggers.includes("Fee default"))
})

test("below-par attendance with a sibling history is Medium", () => {
  const a = assessRisk({ attendancePct: 84, recentScorePct: 60, feeDefault: false, siblingDropout: true })
  assert.equal(a.band, "Medium")
  assert.equal(a.score, 30) // 20 (below-par) + 10 (sibling)
})

test("a healthy learner is Low with an explicit no-factors note", () => {
  const a = assessRisk(low())
  assert.equal(a.band, "Low")
  assert.equal(a.score, 0)
  assert.deepEqual(a.triggers, ["No risk factors flagged"])
})

test("very low scores weigh more than merely declining scores", () => {
  assert.equal(assessRisk({ ...low(), recentScorePct: 30 }).score, 25)
  assert.equal(assessRisk({ ...low(), recentScorePct: 45 }).score, 10)
})

test("listing returns the cohort ordered by risk score, highest first (DB path)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  await recordDropoutRisk({ name: "Low One", cls: "VII-A", absences: 1, attendancePct: 95, recentScorePct: 70, feeDefault: false, siblingDropout: false })
  await recordDropoutRisk({ name: "High One", cls: "IX-B", absences: 14, attendancePct: 60, recentScorePct: 30, feeDefault: true, siblingDropout: false })
  const cohort = await listDropoutRisk()
  assert.equal(cohort[0].name, "High One") // highest score leads
  assert.ok(cohort[0].assessment.score >= cohort[cohort.length - 1].assessment.score)
  __setTestDb(undefined)
})

test("listing is scoped to the requested school and seeded in-memory", async () => {
  __setTestDb(null)
  const cohort = await listDropoutRisk(DEMO_UDISE)
  assert.equal(cohort.length, 4) // demo cohort
  assert.equal(cohort.filter((c) => c.assessment.band === "High").length, 2)
  assert.equal(cohort.filter((c) => c.assessment.band === "Medium").length, 2)
  assert.equal((await listDropoutRisk("00000000000")).length, 0)
})
