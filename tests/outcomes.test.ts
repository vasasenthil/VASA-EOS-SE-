import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import {
  qualityIndex, aggregateMetrics, overallIndex, indexByDimension, opportunityGap, outcomeReport,
  validateOutcome, QUALITY_WEIGHTS, type OutcomeRecord, type OutcomeInput,
} from "@/lib/outcomes"
import { listOutcomes, createOutcome, deleteOutcome, seedOutcomes } from "@/lib/outcomes/store"

function rec(over: Partial<OutcomeRecord> = {}): OutcomeRecord {
  return { id: "o", term: "2025-26 T2", district: "Chennai", schoolCategory: "Government", area: "Urban", gender: "Female", socialCategory: "General", pwd: false, flnPct: 80, attendancePct: 90, transitionPct: 95, passPct: 88, cohortSize: 1000, ...over }
}

test("qualityIndex is the weighted composite of the four metrics", () => {
  // 80*.35 + 90*.2 + 95*.2 + 88*.25 = 28 + 18 + 19 + 22 = 87
  assert.equal(qualityIndex({ flnPct: 80, attendancePct: 90, transitionPct: 95, passPct: 88 }), 87)
  assert.equal(QUALITY_WEIGHTS.fln + QUALITY_WEIGHTS.attendance + QUALITY_WEIGHTS.transition + QUALITY_WEIGHTS.pass, 1)
})

test("aggregateMetrics is cohort-size-weighted (a big weak cohort drags the average)", () => {
  const all = [
    rec({ flnPct: 90, cohortSize: 100 }),
    rec({ flnPct: 50, cohortSize: 900 }),
  ]
  // weighted FLN = (90*100 + 50*900)/1000 = 54
  assert.equal(aggregateMetrics(all).flnPct, 54)
  assert.equal(aggregateMetrics([]).flnPct, 0)
})

test("indexByDimension recomputes the index per group, highest first", () => {
  const all = [
    rec({ area: "Urban", flnPct: 85, cohortSize: 1000 }),
    rec({ area: "Rural", flnPct: 60, cohortSize: 1000 }),
  ]
  const byArea = indexByDimension(all, "area")
  assert.equal(byArea.length, 2)
  assert.equal(byArea[0].value, "Urban") // higher index first
  assert.ok(byArea[0].index > byArea[1].index)
  assert.equal(byArea[0].cohort, 1000)
  // disability dimension derives PwD / Non-PwD
  const byPwd = indexByDimension([rec({ pwd: true }), rec({ pwd: false })], "disability").map((r) => r.value).sort()
  assert.deepEqual(byPwd, ["Non-PwD", "PwD"])
})

test("opportunityGap is the spread between best- and worst-served groups", () => {
  const all = [
    rec({ socialCategory: "General", flnPct: 85, attendancePct: 95, transitionPct: 97, passPct: 92, cohortSize: 1000 }),
    rec({ socialCategory: "ST", flnPct: 55, attendancePct: 80, transitionPct: 84, passPct: 70, cohortSize: 1000 }),
  ]
  const g = opportunityGap(all, "socialCategory")!
  assert.ok(g.gap > 0)
  assert.equal(g.highest.value, "General")
  assert.equal(g.lowest.value, "ST")
  // single-group dimension → no gap
  assert.equal(opportunityGap([rec()], "district"), null)
})

test("outcomeReport surfaces the headline index and the widest gap", () => {
  const all = [
    rec({ area: "Urban", flnPct: 85, cohortSize: 1000 }),
    rec({ area: "Rural", flnPct: 55, cohortSize: 1000 }),
    rec({ gender: "Male", flnPct: 80, cohortSize: 1000 }),
  ]
  const r = outcomeReport(all)
  assert.ok(r.overall > 0 && r.overall <= 100)
  assert.equal(r.cohort, 3000)
  assert.ok(r.gaps.length >= 1)
  assert.ok(r.widestGap !== null)
  // every reported gap is non-negative and widest is the max
  assert.ok(r.gaps.every((g) => g.gap >= 0))
  assert.equal(r.widestGap!.gap, Math.max(...r.gaps.map((g) => g.gap)))
})

test("validateOutcome enforces 0-100 metrics and a positive cohort", () => {
  const ok: OutcomeInput = { term: "T", district: "Chennai", schoolCategory: "Government", area: "Urban", gender: "Female", socialCategory: "General", pwd: false, flnPct: 70, attendancePct: 90, transitionPct: 92, passPct: 85, cohortSize: 100 }
  assert.equal(validateOutcome(ok).ok, true)
  assert.ok(validateOutcome({ ...ok, flnPct: 120 }).errors.flnPct)
  assert.ok(validateOutcome({ ...ok, cohortSize: 0 }).errors.cohortSize)
  assert.ok(validateOutcome({ ...ok, district: "" }).errors.district)
})

test("store: create → list → delete (DB path); seed idempotent surfacing real gaps", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const created = await createOutcome({ term: "T", district: "Salem", schoolCategory: "Government", area: "Rural", gender: "Male", socialCategory: "SC", pwd: false, flnPct: 60, attendancePct: 85, transitionPct: 88, passPct: 78, cohortSize: 500 })
  assert.match(created.id, /^OUT-/)
  assert.equal(await deleteOutcome(created.id), true)
  __setTestDb(undefined)

  __setTestDb(null)
  const all = await listOutcomes()
  assert.ok(all.length >= 12)
  // the seed must actually contain a rural-urban gap to demonstrate the index
  const g = opportunityGap(all, "area")
  assert.ok(g && g.gap > 0, "demo seed should surface a rural-urban opportunity gap")
  assert.equal(await seedOutcomes(), 16)
  __setTestDb(undefined)
})
