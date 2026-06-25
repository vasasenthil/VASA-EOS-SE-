import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { emptyHoliday, validateHoliday, holidayDays, dateInHoliday, holidaysOnDate, isHoliday, queryHolidays, type Holiday, type HolidayInput } from "@/lib/holidays"
import { listHolidays, getHoliday, createHoliday, updateHoliday, deleteHoliday, seedHolidays } from "@/lib/holidays/store"

function valid(): HolidayInput {
  return { name: "Deepavali holidays", category: "Vacation", startDate: "2026-11-07", endDate: "2026-11-12", recurring: false, academicYear: "2026-2027", description: "", status: "Confirmed" }
}

test("validation: range order, academic-year consecutiveness, required fields", () => {
  assert.equal(validateHoliday(valid()).ok, true)
  assert.ok(validateHoliday({ ...valid(), endDate: "2026-11-01" }).errors.endDate) // before start
  assert.ok(validateHoliday({ ...valid(), academicYear: "2026-2028" }).errors.academicYear) // not consecutive
  assert.ok(validateHoliday({ ...valid(), academicYear: "26-27" }).errors.academicYear)
  const e = validateHoliday(emptyHoliday()).errors
  assert.ok(e.startDate && e.endDate)
})

test("holidayDays counts inclusively", () => {
  assert.equal(holidayDays({ startDate: "2026-11-07", endDate: "2026-11-12" }), 6)
  assert.equal(holidayDays({ startDate: "2026-08-15", endDate: "2026-08-15" }), 1)
})

test("dateInHoliday: non-recurring uses full range, recurring matches month/day any year", () => {
  const vac: Holiday = { ...valid(), id: "h1", createdAt: "", updatedAt: "" }
  assert.equal(dateInHoliday(vac, "2026-11-10"), true)
  assert.equal(dateInHoliday(vac, "2027-11-10"), false) // not recurring → only that year
  const republic: Holiday = { ...valid(), id: "h2", recurring: true, startDate: "2027-01-26", endDate: "2027-01-26", createdAt: "", updatedAt: "" }
  assert.equal(dateInHoliday(republic, "2030-01-26"), true) // any year
  assert.equal(dateInHoliday(republic, "2030-01-27"), false)
})

test("integration seam: holidaysOnDate / isHoliday across the calendar", () => {
  const all: Holiday[] = [
    { ...valid(), id: "a", createdAt: "", updatedAt: "" },
    { ...valid(), id: "b", name: "Independence Day", category: "National", recurring: true, startDate: "2026-08-15", endDate: "2026-08-15", createdAt: "", updatedAt: "" },
  ]
  assert.equal(isHoliday(all, "2026-11-09"), true)
  assert.equal(isHoliday(all, "2099-08-15"), true) // recurring national day
  assert.equal(isHoliday(all, "2026-06-01"), false)
  assert.equal(holidaysOnDate(all, "2026-11-09").length, 1)
})

function bulk(n: number): Holiday[] {
  const cats: Holiday["category"][] = ["National", "State", "Vacation", "Exam Break"]
  return Array.from({ length: n }, (_, i) => ({
    ...valid(), id: `h${i}`, name: `H${i}`, category: cats[i % 4], startDate: `2026-${String((i % 12) + 1).padStart(2, "0")}-05`,
    endDate: `2026-${String((i % 12) + 1).padStart(2, "0")}-06`, academicYear: i % 2 ? "2026-2027" : "2027-2028",
    status: i % 3 === 0 ? "Tentative" : "Confirmed", createdAt: `2026-01-${String(i + 1).padStart(2, "0")}`, updatedAt: "",
  })) as Holiday[]
}

test("queryHolidays filters by category/year/month/status, paginates, totals days", () => {
  const all = bulk(24)
  assert.ok(queryHolidays(all, { category: "National" }).holidays.every((h) => h.category === "National"))
  assert.ok(queryHolidays(all, { academicYear: "2026-2027" }).holidays.every((h) => h.academicYear === "2026-2027"))
  assert.ok(queryHolidays(all, { month: "03" }).holidays.every((h) => h.startDate.slice(5, 7) === "03"))
  const all2 = queryHolidays(all, { pageSize: 50 })
  assert.equal(all2.totalDays, 48) // each spans 2 days
  const p = queryHolidays(all, { page: 1, pageSize: 10 })
  assert.equal(p.holidays.length, 10)
  assert.equal(p.totalPages, 3)
})

test("store CRUD: create → read → update → delete (DB path)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const created = await createHoliday(valid())
  assert.match(created.id, /^HOL-/)
  assert.equal((await getHoliday(created.id))?.name, "Deepavali holidays")
  const updated = await updateHoliday(created.id, { ...valid(), status: "Tentative", recurring: true })
  assert.equal(updated?.status, "Tentative")
  assert.equal(updated?.recurring, true)
  assert.equal(await deleteHoliday(created.id), true)
  __setTestDb(undefined)
})

test("in-memory fallback is seeded; seedHolidays is idempotent", async () => {
  __setTestDb(null)
  const before = await listHolidays()
  assert.ok(before.length >= 8)
  assert.equal(await seedHolidays(), 8)
  assert.equal((await listHolidays()).length, before.length)
})
