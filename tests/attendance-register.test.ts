import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { emptyAttendance, validateAttendance, attendanceRate, queryAttendance, type AttendanceEntry, type AttendanceInput } from "@/lib/attendance-register"
import { listAttendance, getAttendance, createAttendance, updateAttendance, deleteAttendance, seedAttendance } from "@/lib/attendance-register/store"

function valid(): AttendanceInput {
  return { student: "Aarthi M.", apaarId: "100200300401", classLevel: "X", section: "A", date: "2026-06-15", status: "Present", remarks: "" }
}

test("attendanceRate counts Present + Late as attended", () => {
  const r = attendanceRate([{ status: "Present" }, { status: "Late" }, { status: "Absent" }, { status: "Leave" }])
  assert.equal(r.total, 4)
  assert.equal(r.attended, 2)
  assert.equal(r.pct, 50)
  assert.equal(attendanceRate([]).pct, 0)
})

test("validation: required fields, date format, optional APAAR", () => {
  assert.equal(validateAttendance(valid()).ok, true)
  assert.ok(validateAttendance({ ...valid(), date: "15-06-2026" }).errors.date)
  assert.ok(validateAttendance({ ...valid(), apaarId: "12" }).errors.apaarId)
  assert.equal(validateAttendance({ ...valid(), apaarId: "" }).ok, true)
  const e = validateAttendance(emptyAttendance()).errors
  assert.ok(e.student && e.classLevel && e.date)
})

function bulk(n: number): AttendanceEntry[] {
  const statuses: AttendanceEntry["status"][] = ["Present", "Absent", "Late", "Leave"]
  return Array.from({ length: n }, (_, i) => ({
    id: `a${i}`, student: `S${i}`, apaarId: "", classLevel: i % 3 === 0 ? "X" : "IX", section: i % 2 ? "A" : "B",
    date: `2026-06-${String((i % 28) + 1).padStart(2, "0")}`, status: statuses[i % 4], remarks: "",
    createdAt: `2026-06-${String((i % 28) + 1).padStart(2, "0")}`, updatedAt: "2026-06-01",
  })) as AttendanceEntry[]
}

test("queryAttendance filters by class/section/status/date and paginates; rate reflects filter", () => {
  const all = bulk(24)
  assert.ok(queryAttendance(all, { classLevel: "X" }).entries.every((e) => e.classLevel === "X"))
  assert.ok(queryAttendance(all, { status: "Present" }).entries.every((e) => e.status === "Present"))
  const present = queryAttendance(all, { status: "Present" })
  assert.equal(present.rate.pct, 100) // all filtered rows are Present
  const p = queryAttendance(all, { page: 1, pageSize: 10 })
  assert.equal(p.entries.length, 10)
  assert.equal(p.totalPages, 3)
})

test("store CRUD: create → read → update → delete (DB path)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const created = await createAttendance(valid())
  assert.match(created.id, /^ATT-/)
  assert.equal((await getAttendance(created.id))?.status, "Present")
  const updated = await updateAttendance(created.id, { ...valid(), status: "Absent", remarks: "Unwell" })
  assert.equal(updated?.status, "Absent")
  assert.equal(await deleteAttendance(created.id), true)
  __setTestDb(undefined)
})

test("in-memory fallback is seeded; seedAttendance is idempotent", async () => {
  __setTestDb(null)
  const before = await listAttendance()
  assert.ok(before.length >= 6)
  assert.equal(await seedAttendance(), 6)
  assert.equal((await listAttendance()).length, before.length)
})
