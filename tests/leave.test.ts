import { test } from "node:test"
import assert from "node:assert/strict"
import { leaveDays, leaveSummary, type LeaveRequest } from "@/lib/leave"

test("leaveDays is inclusive and rejects reversed/invalid ranges", () => {
  assert.equal(leaveDays("2026-06-01", "2026-06-01"), 1)
  assert.equal(leaveDays("2026-06-01", "2026-06-03"), 3)
  assert.equal(leaveDays("2026-06-05", "2026-06-01"), 0)
})

test("leaveSummary counts statuses and sums approved days", () => {
  const reqs: LeaveRequest[] = [
    { id: "1", teacher: "A", type: "casual", from: "2026-06-01", to: "2026-06-02", reason: "", status: "approved" },
    { id: "2", teacher: "B", type: "medical", from: "2026-06-03", to: "2026-06-03", reason: "", status: "pending" },
    { id: "3", teacher: "C", type: "earned", from: "2026-06-04", to: "2026-06-04", reason: "", status: "rejected" },
  ]
  const s = leaveSummary(reqs)
  assert.equal(s.pending, 1)
  assert.equal(s.approved, 1)
  assert.equal(s.rejected, 1)
  assert.equal(s.daysApproved, 2)
})
