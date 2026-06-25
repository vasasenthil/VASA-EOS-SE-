import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import {
  emptyWorkTime, validateWorkTime, instructionalMinutes, periodsOverlap, resolveSchoolDay, isWorkingDay,
  workingDaysInRange, monthWorkingDays, queryWorkTime, type WorkTimeProfile, type WorkTimeInput, type BellPeriod,
} from "@/lib/worktime"
import { listWorkTime, getWorkTime, getActiveWorkTime, createWorkTime, updateWorkTime, deleteWorkTime, seedWorkTime } from "@/lib/worktime/store"
import type { Holiday } from "@/lib/holidays"

const periods: BellPeriod[] = [
  { label: "P1", kind: "Period", startTime: "09:00", endTime: "09:45" },
  { label: "Break", kind: "Break", startTime: "09:45", endTime: "10:00" },
  { label: "P2", kind: "Period", startTime: "10:00", endTime: "10:45" },
]
function valid(): WorkTimeInput {
  return { name: "TN HS", academicYear: "2026-2027", termStart: "2026-06-01", termEnd: "2027-04-30", workingWeekdays: [1, 2, 3, 4, 5, 6], dayStart: "09:00", dayEnd: "10:45", periods, status: "Active" }
}
function profile(): WorkTimeProfile {
  return { ...valid(), id: "wt1", createdAt: "", updatedAt: "" }
}

test("instructionalMinutes counts Period kinds only; periodsOverlap detects clashes", () => {
  assert.equal(instructionalMinutes(periods), 90) // 45 + 45, break excluded
  assert.equal(periodsOverlap(periods), false)
  assert.equal(periodsOverlap([{ label: "A", kind: "Period", startTime: "09:00", endTime: "10:00" }, { label: "B", kind: "Period", startTime: "09:30", endTime: "10:30" }]), true)
})

test("validation: term order, weekdays, day order, period validity + overlap", () => {
  assert.equal(validateWorkTime(valid()).ok, true)
  assert.ok(validateWorkTime({ ...valid(), termEnd: "2026-05-01" }).errors.termEnd)
  assert.ok(validateWorkTime({ ...valid(), workingWeekdays: [] }).errors.workingWeekdays)
  assert.ok(validateWorkTime({ ...valid(), dayEnd: "08:00" }).errors.dayEnd)
  assert.ok(validateWorkTime({ ...valid(), periods: [{ label: "A", kind: "Period", startTime: "09:00", endTime: "10:00" }, { label: "B", kind: "Period", startTime: "09:30", endTime: "10:30" }] }).errors.periods)
  assert.ok(validateWorkTime(emptyWorkTime()).errors.name)
})

const holidays: Holiday[] = [
  { id: "h1", name: "Independence Day", category: "National", startDate: "2026-08-15", endDate: "2026-08-15", recurring: true, academicYear: "2026-2027", description: "", status: "Confirmed", createdAt: "", updatedAt: "" },
]

test("resolveSchoolDay JOINS holidays: term/weekday/holiday → working or reason", () => {
  const p = profile()
  // 2026-06-15 is a Monday in term, not a holiday → working
  const work = resolveSchoolDay(p, holidays, "2026-06-15")
  assert.equal(work.working, true)
  assert.equal(work.periods.length, 3)
  // Sunday → weekly off (2026-06-14 is a Sunday)
  assert.equal(resolveSchoolDay(p, holidays, "2026-06-14").reason.startsWith("Weekly off"), true)
  // Holiday (recurring Independence Day)
  const hol = resolveSchoolDay(p, holidays, "2026-08-15")
  assert.equal(hol.working, false)
  assert.equal(hol.holidayName, "Independence Day")
  // Outside term
  assert.equal(resolveSchoolDay(p, holidays, "2026-05-01").reason, "Outside the academic year")
  assert.equal(isWorkingDay(p, holidays, "2026-06-15"), true)
})

test("workingDaysInRange and monthWorkingDays aggregate the chain", () => {
  const p = profile()
  // June 2026: 30 days. Sundays off. No holidays in June. Mon-Sat working.
  const month = monthWorkingDays(p, holidays, 2026, 6)
  assert.equal(month.length, 30)
  const workingInJune = month.filter((d) => d.working).length
  assert.ok(workingInJune >= 25 && workingInJune <= 26) // ~26 (30 minus ~4-5 Sundays)
  const range = workingDaysInRange(p, holidays, "2026-06-01", "2026-06-30")
  assert.equal(range.total, 30)
  assert.equal(range.working, workingInJune)
  assert.equal(range.instructionalMinutes, workingInJune * 90)
})

test("store CRUD + getActiveWorkTime (DB path)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const created = await createWorkTime(valid())
  assert.match(created.id, /^WT-/)
  const got = await getWorkTime(created.id)
  assert.equal(got?.periods.length, 3)
  assert.equal(got?.workingWeekdays.length, 6)
  const updated = await updateWorkTime(created.id, { ...valid(), status: "Draft" })
  assert.equal(updated?.status, "Draft")
  assert.equal(await deleteWorkTime(created.id), true)
  __setTestDb(undefined)
})

test("in-memory fallback seeded; getActiveWorkTime returns the active profile; seed idempotent", async () => {
  __setTestDb(null)
  const before = await listWorkTime()
  assert.ok(before.length >= 1)
  const active = await getActiveWorkTime("2026-2027")
  assert.equal(active?.status, "Active")
  assert.equal(await seedWorkTime(), 1)
  assert.equal((await listWorkTime()).length, before.length)
  assert.equal(queryWorkTime(before, { status: "Active" }).profiles.length >= 1, true)
})
