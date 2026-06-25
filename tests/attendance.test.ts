import { test } from "node:test"
import assert from "node:assert/strict"
import { defaultRecords, summariseAttendance, NEXT_STATUS } from "@/lib/attendance"
import { SIS_ROSTER } from "@/lib/sis"

test("default records mark everyone present (100%)", () => {
  const s = summariseAttendance(defaultRecords())
  assert.equal(s.total, SIS_ROSTER.length)
  assert.equal(s.present, SIS_ROSTER.length)
  assert.equal(s.pct, 100)
})

test("late counts as attended; absent does not", () => {
  const recs = defaultRecords()
  const ids = SIS_ROSTER.map((x) => x.apaarId)
  recs[ids[0]] = "absent"
  recs[ids[1]] = "late"
  const s = summariseAttendance(recs)
  assert.equal(s.absent, 1)
  assert.equal(s.late, 1)
  // attended = present + late = total - 1 absent
  assert.equal(s.pct, Math.round(((s.total - 1) / s.total) * 100))
})

test("status cycle is a closed loop back to present", () => {
  let st: "present" | "absent" | "late" | "leave" = "present"
  const seen = new Set<string>()
  for (let i = 0; i < 4; i++) {
    seen.add(st)
    st = NEXT_STATUS[st]
  }
  assert.equal(st, "present")
  assert.equal(seen.size, 4)
})
