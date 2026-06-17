import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { emptyAssignment, validateAssignment, dueBand, queryAssignments, type Assignment, type AssignmentInput } from "@/lib/assignments"
import { listAssignments, getAssignment, createAssignment, updateAssignment, deleteAssignment, seedAssignments } from "@/lib/assignments/store"

function valid(): AssignmentInput {
  return { title: "Algebra worksheet 3", classLevel: "X", subject: "Mathematics", type: "Worksheet", dueDate: "2026-06-30", maxMarks: 20, instructions: "Complete all questions.", teacher: "Mr. Sharma", status: "Assigned" }
}

test("validation: required fields, date format and positive max marks", () => {
  assert.equal(validateAssignment(valid()).ok, true)
  const e = validateAssignment(emptyAssignment()).errors
  assert.ok(e.title && e.classLevel && e.subject && e.dueDate && e.instructions && e.teacher)
  assert.ok(validateAssignment({ ...valid(), dueDate: "30-06-2026" }).errors.dueDate)
  assert.ok(validateAssignment({ ...valid(), maxMarks: 0 }).errors.maxMarks)
})

test("dueBand reflects urgency for assigned items only", () => {
  const asOf = new Date("2026-06-28T00:00:00Z")
  assert.equal(dueBand("2026-06-20", "Assigned", asOf), "Overdue")
  assert.equal(dueBand("2026-06-30", "Assigned", asOf), "Due soon")
  assert.equal(dueBand("2026-08-01", "Assigned", asOf), "Upcoming")
  assert.equal(dueBand("2026-06-30", "Draft", asOf), "—") // non-assigned → no band
})

function bulk(n: number): Assignment[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `a${i}`, title: i % 2 ? `Essay ${i}` : `Lab ${i}`, classLevel: i % 3 === 0 ? "X" : "IX",
    subject: i % 2 ? "English" : "Science", type: i % 2 ? "Homework" : "Lab", dueDate: "2026-06-30",
    maxMarks: 20, instructions: "x", teacher: "T", status: i % 2 ? "Assigned" : "Draft",
    createdAt: `2026-01-${String(i + 1).padStart(2, "0")}`, updatedAt: "2026-01-01",
  })) as Assignment[]
}

test("queryAssignments filters by class/subject/type/status and paginates", () => {
  const all = bulk(20)
  assert.ok(queryAssignments(all, { classLevel: "X" }).assignments.every((a) => a.classLevel === "X"))
  assert.ok(queryAssignments(all, { type: "Lab" }).assignments.every((a) => a.type === "Lab"))
  const p = queryAssignments(all, { page: 1, pageSize: 9 })
  assert.equal(p.assignments.length, 9)
  assert.equal(p.totalPages, 3)
})

test("store CRUD: create → read → update → delete (DB path)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const created = await createAssignment(valid())
  assert.match(created.id, /^ASG-/)
  assert.equal((await getAssignment(created.id))?.title, "Algebra worksheet 3")
  const updated = await updateAssignment(created.id, { ...valid(), status: "Closed" })
  assert.equal(updated?.status, "Closed")
  assert.equal(await deleteAssignment(created.id), true)
  __setTestDb(undefined)
})

test("in-memory fallback is seeded; seedAssignments is idempotent", async () => {
  __setTestDb(null)
  const before = await listAssignments()
  assert.ok(before.length >= 6)
  assert.equal(await seedAssignments(), 6)
  assert.equal((await listAssignments()).length, before.length)
})
