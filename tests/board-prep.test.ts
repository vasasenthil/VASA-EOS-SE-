import { test } from "node:test"
import assert from "node:assert/strict"
import {
  EXAM_CENTRES,
  READINESS_CHECKS,
  centreById,
  utilisationPct,
  overAllotted,
  readinessPct,
  clearedToConduct,
  pendingChecks,
  boardPrepSummary,
  toCSV,
} from "@/lib/exams/board-prep"

test("centres have one boolean per readiness check", () => {
  for (const c of EXAM_CENTRES) {
    assert.equal(c.checks.length, READINESS_CHECKS.length)
  }
})

test("a fully-checked, within-capacity centre is cleared", () => {
  const ok = centreById("EC-CHN-12")! // all true, 460/480
  assert.equal(clearedToConduct(ok), true)
  assert.equal(readinessPct(ok), 100)
  assert.equal(pendingChecks(ok).length, 0)
})

test("a missing check blocks clearance and is named", () => {
  const c = centreById("EC-MDU-07")! // connectivity false
  assert.equal(clearedToConduct(c), false)
  assert.deepEqual(pendingChecks(c), ["Connectivity"])
})

test("over-allotment blocks clearance even with all checks met... and is flagged", () => {
  const over = centreById("EC-CBE-03")! // 318/300 over, and seating false
  assert.equal(overAllotted(over), true)
  assert.ok(utilisationPct(over) > 100)
  assert.equal(clearedToConduct(over), false)
})

test("summary tallies clearance, over-allotment and average readiness", () => {
  const s = boardPrepSummary()
  assert.equal(s.centres, EXAM_CENTRES.length)
  assert.equal(s.totalCapacity, EXAM_CENTRES.reduce((n, c) => n + c.capacity, 0))
  assert.equal(s.cleared, EXAM_CENTRES.filter((c) => clearedToConduct(c)).length)
  assert.equal(s.overAllotted, 1) // EC-CBE-03
  assert.ok(s.avgReadinessPct > 0 && s.avgReadinessPct <= 100)
})

test("CSV has a header plus one row per centre", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Centre ID,Name,District,Capacity,Allotted,Readiness %,Cleared")
  assert.equal(lines.length, EXAM_CENTRES.length + 1)
})
