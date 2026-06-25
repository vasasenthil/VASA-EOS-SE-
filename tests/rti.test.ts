import { test } from "node:test"
import assert from "node:assert/strict"
import { nextRtiStatus, daysUsed, daysLeft, isOverdue, rtiSummary, RTI_FLOW, RTI_LIMIT_DAYS, type RtiRequest } from "@/lib/rti"

const r = (status: RtiRequest["status"], receivedDate: string): RtiRequest => ({
  id: `r-${Math.random()}`,
  applicant: "A",
  subject: "S",
  receivedDate,
  status,
  tenantId: "TN-CHN-B1-S1",
})

test("status advances through the flow and clamps at replied", () => {
  assert.equal(nextRtiStatus("received"), "under_process")
  assert.equal(nextRtiStatus("under_process"), "replied")
  assert.equal(nextRtiStatus("replied"), "replied")
  assert.deepEqual(RTI_FLOW, ["received", "under_process", "replied"])
})

test("deadline maths against the 30-day limit", () => {
  assert.equal(daysUsed("2026-06-01", "2026-06-11"), 10)
  assert.equal(daysLeft("2026-06-01", "2026-06-11"), RTI_LIMIT_DAYS - 10)
})

test("overdue only when unanswered past the limit", () => {
  assert.equal(isOverdue(r("under_process", "2026-05-01"), "2026-06-11"), true)
  assert.equal(isOverdue(r("replied", "2026-05-01"), "2026-06-11"), false)
  assert.equal(isOverdue(r("received", "2026-06-01"), "2026-06-11"), false)
})

test("summary counts replied, pending and overdue", () => {
  const s = rtiSummary(
    [r("replied", "2026-05-01"), r("under_process", "2026-04-01"), r("received", "2026-06-05")],
    "2026-06-11",
  )
  assert.equal(s.total, 3)
  assert.equal(s.replied, 1)
  assert.equal(s.pending, 2)
  assert.equal(s.overdue, 1)
})
