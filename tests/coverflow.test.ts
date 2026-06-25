import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import {
  emptyCover, validateCover, weekday, freeFrom, coverSummary, queryCovers,
  type CoverArrangement, type CoverInput,
} from "@/lib/coverflow"
import { listCovers, getCover, createCover, updateCover, deleteCover, seedCovers } from "@/lib/coverflow/store"

function cov(over: Partial<CoverArrangement> = {}): CoverArrangement {
  return { id: "c", date: "2026-06-15", absentTeacher: "Mr. Sharma", reason: "Medical Leave", classLevel: "X", section: "A", period: 2, subject: "Mathematics", substituteTeacher: "Ms. Rao", status: "Assigned", notes: "", createdAt: "", updatedAt: "", ...over }
}

test("weekday: maps an ISO date to its day name", () => {
  assert.equal(weekday("2026-06-15"), "Monday") // 15 Jun 2026 is a Monday
  assert.equal(weekday("2026-06-20"), "Saturday")
  assert.equal(weekday("not-a-date"), "")
})

test("freeFrom: roster minus busy, case-insensitive, sorted", () => {
  const roster = ["Ms. Rao", "Mr. Khan", "Mrs. Selvi", "Mr. Sharma"]
  const busy = ["mr. sharma", "MR. KHAN"]
  const free = freeFrom(busy, roster)
  assert.deepEqual(free, ["Mrs. Selvi", "Ms. Rao"])
  assert.deepEqual(freeFrom([], ["B", "A"]), ["A", "B"])
  assert.deepEqual(freeFrom(["A", "B"], ["A", "B"]), [])
})

test("validateCover: required fields and substitute gate", () => {
  const ok: CoverInput = { date: "2026-06-15", absentTeacher: "Mr. Sharma", reason: "Medical Leave", classLevel: "X", section: "A", period: 2, subject: "Mathematics", substituteTeacher: "Ms. Rao", status: "Assigned", notes: "" }
  assert.equal(validateCover(ok).ok, true)
  assert.ok(validateCover({ ...ok, date: "15-06-2026" }).errors.date)
  assert.ok(validateCover({ ...ok, absentTeacher: "" }).errors.absentTeacher)
  assert.ok(validateCover({ ...ok, reason: "Holiday" }).errors.reason)
  assert.ok(validateCover({ ...ok, classLevel: "" }).errors.classLevel)
  assert.ok(validateCover({ ...ok, section: "Z" }).errors.section)
  assert.ok(validateCover({ ...ok, period: 9 }).errors.period)
  assert.ok(validateCover({ ...ok, subject: "Astrology" }).errors.subject)
  assert.ok(validateCover({ ...ok, status: "Done" as CoverInput["status"] }).errors.status)
  // Assigned/Completed require a substitute; Pending does not.
  assert.ok(validateCover({ ...ok, substituteTeacher: "" }).errors.substituteTeacher)
  assert.equal(validateCover({ ...ok, status: "Pending", substituteTeacher: "" }).ok, true)
  assert.equal(emptyCover().status, "Pending")
})

function bulk(n: number): CoverArrangement[] {
  const statuses: CoverArrangement["status"][] = ["Pending", "Assigned", "Completed"]
  return Array.from({ length: n }, (_, i) => cov({
    id: `c${i}`, period: (i % 8) + 1, status: statuses[i % 3], date: i % 2 === 0 ? "2026-06-15" : "2026-06-16",
    substituteTeacher: statuses[i % 3] === "Pending" ? "" : "Ms. Rao", reason: i % 2 === 0 ? "Medical Leave" : "Training",
    absentTeacher: i % 2 === 0 ? "Mr. Sharma" : "Ms. Verma",
  }))
}

test("coverSummary + queryCovers (filter, pending-first sort, paginate)", () => {
  const all = bulk(12)
  const s = coverSummary(all)
  assert.equal(s.total, 12)
  assert.ok(s.pending >= 1 && s.assigned >= 1 && s.completed >= 1)
  // status filter
  assert.ok(queryCovers(all, { status: "Pending" }).covers.every((c) => c.status === "Pending"))
  // reason filter
  assert.ok(queryCovers(all, { reason: "Training" }).covers.every((c) => c.reason === "Training"))
  // date filter
  assert.ok(queryCovers(all, { date: "2026-06-15" }).covers.every((c) => c.date === "2026-06-15"))
  // query text
  assert.ok(queryCovers(all, { query: "verma" }).covers.every((c) => /verma/i.test(c.absentTeacher)))
  // default sort → pending first
  const def = queryCovers(all, { pageSize: 50 }).covers
  assert.equal(def[0].status, "Pending")
  // period sort ascending
  const byP = queryCovers(all, { sortBy: "period", sortDir: "asc", pageSize: 50 }).covers
  assert.ok(byP[0].period <= byP[byP.length - 1].period)
  // paginate
  const p = queryCovers(all, { pageSize: 5 })
  assert.equal(p.covers.length, 5)
  assert.equal(p.totalPages, 3)
})

test("store CRUD: create → read → update → delete (DB path)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const created = await createCover({ date: "2026-06-15", absentTeacher: "Mr. New", reason: "Casual Leave", classLevel: "IX", section: "B", period: 3, subject: "English", substituteTeacher: "", status: "Pending", notes: "" })
  assert.match(created.id, /^COV-/)
  assert.equal((await getCover(created.id))?.absentTeacher, "Mr. New")
  const updated = await updateCover(created.id, { date: "2026-06-15", absentTeacher: "Mr. New", reason: "Casual Leave", classLevel: "IX", section: "B", period: 3, subject: "English", substituteTeacher: "Ms. Rao", status: "Assigned", notes: "" })
  assert.equal(updated?.status, "Assigned")
  assert.equal(updated?.substituteTeacher, "Ms. Rao")
  assert.equal(await deleteCover(created.id), true)
  assert.equal(await updateCover("missing-id", { date: "2026-06-15", absentTeacher: "X", reason: "Casual Leave", classLevel: "IX", section: "B", period: 3, subject: "English", substituteTeacher: "", status: "Pending", notes: "" }), undefined)
  __setTestDb(undefined)
})

test("in-memory fallback seeded; seedCovers idempotent", async () => {
  __setTestDb(null)
  const before = await listCovers()
  assert.ok(before.length >= 4)
  assert.equal(await seedCovers(), 4)
  assert.equal((await listCovers()).length, before.length)
  assert.equal(await deleteCover("missing"), false)
  __setTestDb(undefined)
})
