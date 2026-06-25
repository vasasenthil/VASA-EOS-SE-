import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { emptyGrade, validateGrade, percentage, letterGrade, queryGrades, type Grade, type GradeInput } from "@/lib/grades"
import { listGrades, getGrade, createGrade, updateGrade, deleteGrade, seedGrades } from "@/lib/grades/store"

function valid(): GradeInput {
  return { student: "Kavya R.", apaarId: "100200300401", classLevel: "X", subject: "Mathematics", term: "Term 1", assessment: "SA1", marks: 94, maxMarks: 100, status: "Published" }
}

test("percentage and letter grade follow the TN/CBSE bands", () => {
  assert.equal(percentage(94, 100), 94)
  assert.equal(percentage(0, 0), 0)
  assert.equal(letterGrade(94), "A1")
  assert.equal(letterGrade(85), "A2")
  assert.equal(letterGrade(45), "C2") // 41–50 band
  assert.equal(letterGrade(40), "D") // 33–40 band
  assert.equal(letterGrade(30), "E")
})

test("validation: marks cannot exceed max; APAAR optional but must be 12 digits if given", () => {
  assert.equal(validateGrade(valid()).ok, true)
  assert.ok(validateGrade({ ...valid(), marks: 120 }).errors.marks)
  assert.ok(validateGrade({ ...valid(), maxMarks: 0 }).errors.maxMarks)
  assert.ok(validateGrade({ ...valid(), apaarId: "123" }).errors.apaarId)
  assert.equal(validateGrade({ ...valid(), apaarId: "" }).ok, true) // blank APAAR is fine
  const { errors } = validateGrade(emptyGrade())
  assert.ok(errors.student && errors.classLevel && errors.subject)
})

function bulk(n: number): Grade[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `g${i}`, student: i % 2 ? `Asha ${i}` : `Bala ${i}`, apaarId: "", classLevel: i % 3 === 0 ? "X" : "IX",
    subject: i % 2 ? "Mathematics" : "Science", term: "Term 1", assessment: "SA1", marks: i, maxMarks: 100,
    status: i % 2 ? "Published" : "Draft", createdAt: `2026-01-${String(i + 1).padStart(2, "0")}`, updatedAt: "2026-01-01",
  })) as Grade[]
}

test("queryGrades filters by class/subject/status and paginates", () => {
  const all = bulk(25)
  assert.ok(queryGrades(all, { classLevel: "X" }).grades.every((g) => g.classLevel === "X"))
  assert.ok(queryGrades(all, { subject: "Mathematics" }).grades.every((g) => g.subject === "Mathematics"))
  assert.ok(queryGrades(all, { status: "Published" }).grades.every((g) => g.status === "Published"))
  const p = queryGrades(all, { page: 1, pageSize: 10 })
  assert.equal(p.grades.length, 10)
  assert.equal(p.totalPages, 3)
})

test("store CRUD: create → read → update → delete (DB path)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const created = await createGrade(valid())
  assert.match(created.id, /^GRD-/)
  assert.equal((await getGrade(created.id))?.marks, 94)
  const updated = await updateGrade(created.id, { ...valid(), marks: 88, status: "Draft" })
  assert.equal(updated?.marks, 88)
  assert.equal(await deleteGrade(created.id), true)
  __setTestDb(undefined)
})

test("in-memory fallback is seeded; seedGrades is idempotent", async () => {
  __setTestDb(null)
  const before = await listGrades()
  assert.ok(before.length >= 6)
  assert.equal(await seedGrades(), 6)
  assert.equal((await listGrades()).length, before.length) // idempotent
})
