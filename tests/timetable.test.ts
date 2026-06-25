import { test } from "node:test"
import assert from "node:assert/strict"
import { SAMPLE_GRID, TEACHERS, teacherSlots, freeTeachers, suggestSubstitutes } from "@/lib/timetable"

test("teacherSlots finds a teacher's assigned periods", () => {
  const slots = teacherSlots(SAMPLE_GRID, "Mr. Raja")
  assert.ok(slots.length >= 1)
  assert.ok(slots.every((s) => s.subject.length > 0))
})

test("freeTeachers excludes the teacher busy in that slot", () => {
  // Mon-1 is Mrs. Lakshmi in the sample grid.
  const free = freeTeachers(SAMPLE_GRID, "Mon", 1)
  assert.ok(!free.includes("Mrs. Lakshmi"))
  assert.ok(free.includes("Mr. Raja"))
})

test("suggestSubstitutes proposes free covers for each absent period and never the absentee", () => {
  const subs = suggestSubstitutes(SAMPLE_GRID, "Mr. Raja")
  assert.ok(subs.length >= 1)
  for (const s of subs) {
    assert.ok(!s.candidates.includes("Mr. Raja"))
    assert.ok(s.candidates.every((c) => TEACHERS.includes(c)))
  }
})
