import { test } from "node:test"
import assert from "node:assert/strict"
import { resolveDayPlan, weekdayName, type DayPlanInputs } from "@/lib/dayplan"
import type { WorkTimeProfile, BellPeriod } from "@/lib/worktime"
import type { Holiday } from "@/lib/holidays"
import type { TimetableEntry } from "@/lib/timetable-manager"
import type { LessonPlan } from "@/lib/lessonplans"

const periods: BellPeriod[] = [
  { label: "Assembly", kind: "Assembly", startTime: "08:50", endTime: "09:00" },
  { label: "Period 1", kind: "Period", startTime: "09:00", endTime: "09:45" },
  { label: "Period 2", kind: "Period", startTime: "09:45", endTime: "10:30" },
  { label: "Break", kind: "Break", startTime: "10:30", endTime: "10:45" },
  { label: "Period 3", kind: "Period", startTime: "10:45", endTime: "11:30" },
]
const profile: WorkTimeProfile = {
  id: "wt1", name: "TN", academicYear: "2026-2027", termStart: "2026-06-01", termEnd: "2027-04-30",
  workingWeekdays: [1, 2, 3, 4, 5, 6], dayStart: "08:50", dayEnd: "11:30", periods, status: "Active", createdAt: "", updatedAt: "",
}
const holidays: Holiday[] = [
  { id: "h1", name: "Independence Day", category: "National", startDate: "2026-08-15", endDate: "2026-08-15", recurring: true, academicYear: "2026-2027", description: "", status: "Confirmed", createdAt: "", updatedAt: "" },
]
function tt(over: Partial<TimetableEntry>): TimetableEntry {
  return { id: "e", classLevel: "X", section: "A", day: "Monday", period: 1, startTime: "09:00", endTime: "09:45", subject: "Tamil", teacher: "Mrs. Selvi", room: "R-101", createdAt: "", updatedAt: "", ...over }
}
function lp(over: Partial<LessonPlan>): LessonPlan {
  return {
    id: "l", classLevel: "X", section: "A", subject: "Tamil", teacher: "Mrs. Selvi", date: "2026-06-15", period: 1, startTime: "09:00", endTime: "09:45",
    lessonType: "Theory", topic: "Intro", objectives: "", previousTopics: [], furtherTopics: [], materialsToBring: ["Book"], homework: "Read ch.1",
    lessonPlannerLink: "", classNotes: [], status: "Planned", createdAt: "", updatedAt: "", ...over,
  }
}

test("weekdayName resolves the weekday", () => {
  assert.equal(weekdayName("2026-06-15"), "Monday")
  assert.equal(weekdayName("2026-06-14"), "Sunday")
})

test("non-working day returns the reason and no periods", () => {
  const base: DayPlanInputs = { profile, holidays, timetable: [], lessons: [], classLevel: "X", section: "A", date: "2026-08-15" }
  const plan = resolveDayPlan(base)
  assert.equal(plan.working, false)
  assert.equal(plan.holidayName, "Independence Day")
  assert.equal(plan.periods.length, 0)
  // Sunday
  assert.equal(resolveDayPlan({ ...base, date: "2026-06-14" }).reason.startsWith("Weekly off"), true)
  // no profile
  assert.equal(resolveDayPlan({ ...base, profile: null }).reason, "No working-time profile")
})

test("working day JOINS timetable + lesson plans onto bell periods by ordinal", () => {
  // Monday 2026-06-15. Timetable: P1 Tamil, P2 Maths. Lesson plan on P1.
  const timetable = [tt({ id: "a", day: "Monday", period: 1, subject: "Tamil" }), tt({ id: "b", day: "Monday", period: 2, subject: "Mathematics", teacher: "Mr. Sharma" })]
  const lessons = [lp({ id: "L1", date: "2026-06-15", period: 1, topic: "Tamil unit 1" })]
  const plan = resolveDayPlan({ profile, holidays, timetable, lessons, classLevel: "X", section: "A", date: "2026-06-15" })
  assert.equal(plan.working, true)
  assert.equal(plan.weekday, "Monday")
  assert.equal(plan.periods.length, 5) // assembly + 3 periods + break

  // Assembly has no ordinal/entry
  assert.equal(plan.periods[0].kind, "Assembly")
  assert.equal(plan.periods[0].ordinal, null)
  // Period 1 → ordinal 1, Tamil entry + lesson attached
  const p1 = plan.periods[1]
  assert.equal(p1.ordinal, 1)
  assert.equal(p1.entry?.subject, "Tamil")
  assert.equal(p1.lesson?.topic, "Tamil unit 1")
  // Period 2 → ordinal 2, Maths entry, no lesson
  const p2 = plan.periods[2]
  assert.equal(p2.ordinal, 2)
  assert.equal(p2.entry?.subject, "Mathematics")
  assert.equal(p2.lesson, null)
  // Period 3 (after the break) → ordinal 3, no entry
  const p3 = plan.periods[4]
  assert.equal(p3.ordinal, 3)
  assert.equal(p3.entry, null)

  assert.deepEqual(plan.stats, { teaching: 3, scheduled: 2, planned: 1 })
})

test("entries/lessons for other class/section/date are not joined", () => {
  const timetable = [tt({ id: "a", day: "Monday", period: 1, section: "B" })] // section B, not A
  const lessons = [lp({ id: "L1", date: "2026-06-16", period: 1 })] // different date
  const plan = resolveDayPlan({ profile, holidays, timetable, lessons, classLevel: "X", section: "A", date: "2026-06-15" })
  assert.equal(plan.stats.scheduled, 0)
  assert.equal(plan.stats.planned, 0)
})
