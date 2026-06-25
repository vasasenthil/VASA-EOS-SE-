import { test } from "node:test"
import assert from "node:assert/strict"
import { equityAllocation } from "@/lib/outcomes/allocation"
import type { OutcomeRecord } from "@/lib/outcomes"

function rec(over: Partial<OutcomeRecord> = {}): OutcomeRecord {
  return { id: "o", term: "T", district: "Chennai", schoolCategory: "Government", area: "Urban", gender: "Female", socialCategory: "General", pwd: false, flnPct: 80, attendancePct: 90, transitionPct: 95, passPct: 88, cohortSize: 1000, ...over }
}

// Two districts of equal size: one high-outcome (strong), one low-outcome (weak).
const records: OutcomeRecord[] = [
  rec({ id: "a", district: "Chennai", flnPct: 88, attendancePct: 96, transitionPct: 98, passPct: 94, cohortSize: 1000 }),
  rec({ id: "b", district: "Nilgiris", flnPct: 55, attendancePct: 80, transitionPct: 84, passPct: 70, cohortSize: 1000 }),
]

test("allocation is evidence-fed: the worse-measured district is top priority and gets more per student", () => {
  const plan = equityAllocation(records, 1_000_000_000)
  assert.equal(plan.topPriority, "Nilgiris") // lower Quality Index → first
  const nil = plan.lines.find((l) => l.district === "Nilgiris")!
  const chn = plan.lines.find((l) => l.district === "Chennai")!
  assert.ok(nil.need > chn.need, "weaker district carries more need")
  assert.ok(nil.perStudent > chn.perStudent, "equity → more rupees per student where outcomes are worse")
  assert.ok(nil.share > chn.share, "and a larger total share at equal cohort size")
})

test("the whole envelope is distributed (no rupees lost or invented)", () => {
  const pool = 1_000_000_000
  const plan = equityAllocation(records, pool)
  const total = plan.lines.reduce((s, l) => s + l.share, 0)
  // rounding may differ by at most one rupee per district
  assert.ok(Math.abs(total - pool) <= plan.lines.length)
})

test("progressivity ratio exceeds 1 (the split is progressive, not flat)", () => {
  const plan = equityAllocation(records, 1_000_000_000)
  assert.ok(plan.progressivity > 1, `progressivity ${plan.progressivity} should be > 1`)
  assert.ok(plan.equalPerStudent > 0)
})

test("equal outcomes → equal per-student (no progressivity)", () => {
  const equal: OutcomeRecord[] = [
    rec({ id: "a", district: "A", cohortSize: 500 }),
    rec({ id: "b", district: "B", cohortSize: 500 }),
  ]
  const plan = equityAllocation(equal, 1_000_000)
  assert.equal(plan.progressivity, 1)
  assert.equal(plan.lines[0].perStudent, plan.lines[1].perStudent)
})

test("empty records → an empty, safe plan", () => {
  const plan = equityAllocation([], 1_000_000)
  assert.equal(plan.lines.length, 0)
  assert.equal(plan.topPriority, "")
  assert.equal(plan.progressivity, 1)
})
