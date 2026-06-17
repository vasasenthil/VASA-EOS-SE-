import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { emptyStudent, validateStudent, ageYears, queryStudents, type StudentRecord, type StudentInput } from "@/lib/students"
import { listStudents, getStudent, createStudent, updateStudent, deleteStudent, seedStudents } from "@/lib/students/store"

function valid(): StudentInput {
  return { apaarId: "100200300401", name: "Aarthi M.", gender: "Female", dob: "2010-05-12", classLevel: "X", section: "A", category: "MBC", guardianName: "Murugan S.", contactPhone: "9840012301", status: "Enrolled" }
}

test("ageYears computes whole years and rejects bad dates", () => {
  const asOf = new Date("2026-06-01T00:00:00Z")
  assert.equal(ageYears("2010-05-12", asOf), 16)
  assert.equal(ageYears("2010-09-01", asOf), 15) // birthday not yet reached
  assert.equal(ageYears("not-a-date"), -1)
})

test("validation: APAAR 12 digits, 10-digit phone, plausible dob, required fields", () => {
  assert.equal(validateStudent(valid()).ok, true)
  assert.ok(validateStudent({ ...valid(), apaarId: "123" }).errors.apaarId)
  assert.ok(validateStudent({ ...valid(), contactPhone: "12345" }).errors.contactPhone)
  assert.ok(validateStudent({ ...valid(), dob: "1990-01-01" }).errors.dob) // too old
  assert.ok(validateStudent({ ...valid(), dob: "31-12-2010" }).errors.dob) // wrong format
  const e = validateStudent(emptyStudent()).errors
  assert.ok(e.apaarId && e.name && e.gender && e.classLevel && e.category && e.guardianName)
})

function bulk(n: number): StudentRecord[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `s${i}`, apaarId: `1002003004${String(i).padStart(2, "0")}`, name: i % 2 ? `Asha ${i}` : `Bala ${i}`,
    gender: i % 2 ? "Female" : "Male", dob: "2010-05-12", classLevel: i % 3 === 0 ? "X" : "IX",
    section: i % 2 ? "A" : "B", category: i % 2 ? "BC" : "SC", guardianName: "G", contactPhone: "9840000000",
    status: i % 4 === 0 ? "Transferred" : "Enrolled", createdAt: `2026-01-${String(i + 1).padStart(2, "0")}`, updatedAt: "2026-01-01",
  })) as StudentRecord[]
}

test("queryStudents filters by class/section/category/status and paginates", () => {
  const all = bulk(25)
  assert.ok(queryStudents(all, { classLevel: "X" }).students.every((s) => s.classLevel === "X"))
  assert.ok(queryStudents(all, { section: "A" }).students.every((s) => s.section === "A"))
  assert.ok(queryStudents(all, { status: "Enrolled" }).students.every((s) => s.status === "Enrolled"))
  const p = queryStudents(all, { page: 1, pageSize: 10 })
  assert.equal(p.students.length, 10)
  assert.equal(p.totalPages, 3)
})

test("store CRUD: create → read → update → delete (DB path)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const created = await createStudent(valid())
  assert.match(created.id, /^STU-/)
  assert.equal((await getStudent(created.id))?.name, "Aarthi M.")
  const updated = await updateStudent(created.id, { ...valid(), classLevel: "XI", status: "Transferred" })
  assert.equal(updated?.classLevel, "XI")
  assert.equal(updated?.status, "Transferred")
  assert.equal(await deleteStudent(created.id), true)
  __setTestDb(undefined)
})

test("in-memory fallback is seeded; seedStudents is idempotent", async () => {
  __setTestDb(null)
  const before = await listStudents()
  assert.ok(before.length >= 6)
  assert.equal(await seedStudents(), 6)
  assert.equal((await listStudents()).length, before.length)
})
