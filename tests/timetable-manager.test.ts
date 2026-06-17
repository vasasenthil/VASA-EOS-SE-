import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { emptyTimetableEntry, validateTimetable, findClashes, describeClash, queryTimetable, type TimetableEntry, type TimetableInput } from "@/lib/timetable-manager"
import { listTimetable, getTimetableEntry, createTimetableEntry, updateTimetableEntry, deleteTimetableEntry, seedTimetable } from "@/lib/timetable-manager/store"

function valid(): TimetableInput {
  return { classLevel: "X", section: "A", day: "Monday", period: 1, startTime: "09:00", endTime: "09:45", subject: "Mathematics", teacher: "Mr. Sharma", room: "R-101" }
}

test("validation: class/section/day/period, time format and end>start", () => {
  assert.equal(validateTimetable(valid()).ok, true)
  assert.ok(validateTimetable({ ...valid(), period: 9 }).errors.period)
  assert.ok(validateTimetable({ ...valid(), startTime: "9am" }).errors.startTime)
  assert.ok(validateTimetable({ ...valid(), endTime: "08:00" }).errors.endTime) // before start
  const e = validateTimetable(emptyTimetableEntry()).errors
  assert.ok(e.classLevel && e.subject && e.teacher && e.room)
})

function entry(over: Partial<TimetableEntry>): TimetableEntry {
  return { id: "e1", classLevel: "X", section: "A", day: "Monday", period: 1, startTime: "09:00", endTime: "09:45", subject: "Mathematics", teacher: "Mr. Sharma", room: "R-101", createdAt: "2026-01-01", updatedAt: "2026-01-01", ...over }
}

test("findClashes detects class and teacher double-booking; excludeId skips self", () => {
  const all = [entry({ id: "a" }), entry({ id: "b", classLevel: "IX", section: "B", teacher: "Ms. Rao", period: 2 })]
  // same class+section, same slot → clash
  assert.equal(findClashes(all, valid()).length, 1)
  // same teacher, different class, same slot → clash
  assert.equal(findClashes(all, { ...valid(), classLevel: "VIII", section: "C" }).length, 1)
  // different slot → no clash
  assert.equal(findClashes(all, { ...valid(), period: 5 }).length, 0)
  // editing the same row → excluded
  assert.equal(findClashes(all, valid(), "a").length, 0)
  const msg = describeClash(all[0], valid())
  assert.match(msg, /already/)
})

function bulk(n: number): TimetableEntry[] {
  const days = ["Monday", "Tuesday", "Wednesday"]
  return Array.from({ length: n }, (_, i) => entry({
    id: `t${i}`, day: days[i % 3], period: (i % 8) + 1, classLevel: i % 2 ? "X" : "IX", section: i % 2 ? "A" : "B",
    subject: i % 2 ? "Mathematics" : "Science", createdAt: `2026-01-${String(i + 1).padStart(2, "0")}`,
  }))
}

test("queryTimetable filters by class/day/subject and paginates; day sort orders by weekday", () => {
  const all = bulk(20)
  assert.ok(queryTimetable(all, { classLevel: "X" }).entries.every((e) => e.classLevel === "X"))
  assert.ok(queryTimetable(all, { day: "Monday" }).entries.every((e) => e.day === "Monday"))
  const sorted = queryTimetable(all, { sortBy: "day", sortDir: "asc", pageSize: 50 }).entries
  // first entry should be a Monday (weekday 0)
  assert.equal(sorted[0].day, "Monday")
  const p = queryTimetable(all, { page: 1, pageSize: 12 })
  assert.equal(p.entries.length, 12)
  assert.equal(p.totalPages, 2)
})

test("store CRUD: create → read → update → delete (DB path)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const created = await createTimetableEntry(valid())
  assert.match(created.id, /^TT-/)
  assert.equal((await getTimetableEntry(created.id))?.subject, "Mathematics")
  const updated = await updateTimetableEntry(created.id, { ...valid(), room: "Lab-2", period: 3 })
  assert.equal(updated?.room, "Lab-2")
  assert.equal(updated?.period, 3)
  assert.equal(await deleteTimetableEntry(created.id), true)
  __setTestDb(undefined)
})

test("in-memory fallback is seeded; seedTimetable is idempotent", async () => {
  __setTestDb(null)
  const before = await listTimetable()
  assert.ok(before.length >= 6)
  assert.equal(await seedTimetable(), 6)
  assert.equal((await listTimetable()).length, before.length)
})
