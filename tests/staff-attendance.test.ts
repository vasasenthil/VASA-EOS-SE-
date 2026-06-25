import { test } from "node:test"
import assert from "node:assert/strict"
import { defaultStaffRecords, summariseStaff, NEXT_STAFF_STATUS } from "@/lib/staff-attendance"

const STAFF = ["A", "B", "C", "D"]

test("default records are all present (100%)", () => {
  const s = summariseStaff(defaultStaffRecords(STAFF), STAFF)
  assert.equal(s.present, 4)
  assert.equal(s.pct, 100)
})

test("present, late and on_duty all count as attended; absent does not", () => {
  const recs = { A: "absent", B: "late", C: "on_duty", D: "present" } as const
  const s = summariseStaff(recs, STAFF)
  assert.equal(s.absent, 1)
  assert.equal(s.pct, 75) // 3 of 4 attended
})

test("status cycle returns to present after four steps", () => {
  let st: "present" | "absent" | "late" | "on_duty" = "present"
  for (let i = 0; i < 4; i++) st = NEXT_STAFF_STATUS[st]
  assert.equal(st, "present")
})
