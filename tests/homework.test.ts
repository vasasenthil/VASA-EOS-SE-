import { test } from "node:test"
import assert from "node:assert/strict"
import { nextHwStatus, isHwOverdue, homeworkSummary, type Homework } from "@/lib/homework"

const hw = (over: Partial<Homework>): Homework => ({ id: "h", subject: "Sci", title: "t", dueDate: "2026-06-10", status: "assigned", ...over })

test("status advances assigned -> submitted -> graded", () => {
  assert.equal(nextHwStatus("assigned"), "submitted")
  assert.equal(nextHwStatus("submitted"), "graded")
  assert.equal(nextHwStatus("graded"), "graded")
})

test("overdue only when assigned and past due", () => {
  assert.equal(isHwOverdue(hw({}), "2026-06-20"), true)
  assert.equal(isHwOverdue(hw({}), "2026-06-05"), false)
  assert.equal(isHwOverdue(hw({ status: "submitted" }), "2026-06-20"), false)
})

test("summary counts statuses and overdue", () => {
  const items = [hw({ id: "a" }), hw({ id: "b", status: "submitted" }), hw({ id: "c", status: "graded" })]
  const s = homeworkSummary(items, "2026-06-20")
  assert.equal(s.total, 3)
  assert.equal(s.assigned, 1)
  assert.equal(s.overdue, 1)
})
