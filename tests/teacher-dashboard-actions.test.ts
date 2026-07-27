import assert from "node:assert/strict"
import test from "node:test"
import type { SupabaseClient } from "@supabase/supabase-js"

import { getTeacherAttendanceSummary } from "@/lib/attendance/store"
import { getTeacherAssignments } from "@/lib/assignments/store"
import { getFlaggedStudentsForTeacher } from "@/lib/earlywarning/store"
import { getNoticesForTeacher } from "@/lib/notices/store"
import { __setTestDb } from "@/lib/persistence"
import { getTeacherTimetable, seedTimetable } from "@/lib/timetable-manager/store"
import { makeFakeDb } from "./helpers/fake-db"

test("teacher dashboard store adapters return live operational summaries", async () => {
  const [attendance, assignments, flaggedStudents, notices] = await Promise.all([
    getTeacherAttendanceSummary("demo-teacher", "33010100101", new Date("2026-07-16T00:00:00Z")),
    getTeacherAssignments("demo-teacher", "33010100101"),
    getFlaggedStudentsForTeacher("demo-teacher", "33010100101"),
    getNoticesForTeacher("demo-teacher", "33010100101"),
  ])
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  await seedTimetable()
  const timetable = await getTeacherTimetable("demo-teacher", "33010100101", new Date("2026-07-13T00:00:00Z"))
  __setTestDb(undefined)

  assert.deepEqual(attendance, { present: 0, absent: 0, late: 0, total: 0, percentage: 0 })
  assert.ok(assignments.pending > 0)
  assert.ok(assignments.overdue >= 0)
  assert.ok(timetable.length > 0)
  assert.ok(timetable.every((slot) => slot.class && slot.subject && slot.startTime && slot.endTime))
  assert.ok(flaggedStudents.length > 0)
  assert.ok(flaggedStudents.every((student) => student.studentId && student.studentName && student.reason))
  assert.ok(notices.length > 0)
  assert.ok(notices.every((notice) => ["high", "medium", "low"].includes(notice.priority)))
})
