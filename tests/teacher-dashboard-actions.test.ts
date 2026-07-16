import assert from "node:assert/strict"
import test from "node:test"

import { getTeacherAttendanceSummary } from "@/lib/attendance/store"
import { getTeacherAssignments } from "@/lib/assignments/store"
import { getFlaggedStudentsForTeacher } from "@/lib/earlywarning/store"
import { getNoticesForTeacher } from "@/lib/notices/store"
import { getTeacherTimetable } from "@/lib/timetable-manager/store"

test("teacher dashboard store adapters return live operational summaries", async () => {
  const [attendance, assignments, timetable, flaggedStudents, notices] = await Promise.all([
    getTeacherAttendanceSummary("demo-teacher", "33010100101", new Date("2026-07-16T00:00:00Z")),
    getTeacherAssignments("demo-teacher", "33010100101"),
    getTeacherTimetable("demo-teacher", "33010100101", new Date("2026-07-13T00:00:00Z")),
    getFlaggedStudentsForTeacher("demo-teacher", "33010100101"),
    getNoticesForTeacher("demo-teacher", "33010100101"),
  ])

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
