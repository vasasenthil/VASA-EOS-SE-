import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { emptyCourse, validateCourse, queryCourses, type Course, type CourseInput } from "@/lib/courses"
import { listCourses, getCourse, createCourse, updateCourse, deleteCourse, seedCourses } from "@/lib/courses/store"

function valid(): CourseInput {
  return { code: "MAT-X", name: "Mathematics", classLevel: "X", subjectArea: "Mathematics", description: "Algebra and geometry.", credits: 4, teacher: "Mr. Sharma", status: "Active" }
}

// ── validation ───────────────────────────────────────────────────────────────
test("an empty course fails validation with field errors", () => {
  const { ok, errors } = validateCourse(emptyCourse())
  assert.equal(ok, false)
  assert.ok(errors.code && errors.name && errors.classLevel && errors.subjectArea && errors.description && errors.teacher)
})

test("a complete course passes; the code pattern and credit bounds are enforced", () => {
  assert.equal(validateCourse(valid()).ok, true)
  assert.ok(validateCourse({ ...valid(), code: "math-x" }).errors.code)
  assert.ok(validateCourse({ ...valid(), code: "MAT-XV" }).errors.code)
  assert.ok(validateCourse({ ...valid(), credits: 0 }).errors.credits)
  assert.ok(validateCourse({ ...valid(), credits: 11 }).errors.credits)
})

// ── pure query (filter / sort / paginate) ─────────────────────────────────────
function bulk(n: number): Course[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `c${i}`, code: `MAT-${i}`, name: i % 2 ? `Algebra ${i}` : `Science ${i}`,
    classLevel: i % 3 === 0 ? "X" : "IX", subjectArea: "Mathematics", description: "x", credits: 4,
    teacher: "T", status: i % 2 ? "Active" : "Draft", createdAt: `2026-01-${String(i + 1).padStart(2, "0")}`, updatedAt: "2026-01-01",
  })) as Course[]
}

test("queryCourses filters by search, status and class", () => {
  const all = bulk(12)
  assert.ok(queryCourses(all, { query: "algebra" }).courses.every((c) => c.name.toLowerCase().includes("algebra")))
  assert.ok(queryCourses(all, { status: "Active" }).courses.every((c) => c.status === "Active"))
  assert.ok(queryCourses(all, { classLevel: "X" }).courses.every((c) => c.classLevel === "X"))
})

test("queryCourses paginates and clamps the page", () => {
  const all = bulk(20)
  const p1 = queryCourses(all, { page: 1, pageSize: 9 })
  assert.equal(p1.courses.length, 9)
  assert.equal(p1.totalPages, 3)
  const beyond = queryCourses(all, { page: 99, pageSize: 9 })
  assert.equal(beyond.page, 3) // clamped to last page
})

// ── store CRUD (DB path + in-memory) ──────────────────────────────────────────
test("create → read → update → delete (DB path)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const created = await createCourse(valid())
  assert.match(created.id, /^CRS-/)
  assert.equal((await getCourse(created.id))?.name, "Mathematics")
  const updated = await updateCourse(created.id, { ...valid(), name: "Advanced Mathematics", status: "Archived" })
  assert.equal(updated?.name, "Advanced Mathematics")
  assert.equal(updated?.status, "Archived")
  assert.equal(await deleteCourse(created.id), true)
  __setTestDb(undefined)
})

test("updating a missing course returns undefined", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  assert.equal(await updateCourse("CRS-NOPE", valid()), undefined)
  __setTestDb(undefined)
})

test("in-memory fallback is seeded; seedCourses is idempotent", async () => {
  __setTestDb(null)
  const before = await listCourses()
  assert.ok(before.length >= 6) // demo catalogue
  const n = await seedCourses()
  assert.equal(n, 6)
  const after = await listCourses()
  assert.equal(after.length, before.length) // idempotent (no duplicate demo ids)
})
