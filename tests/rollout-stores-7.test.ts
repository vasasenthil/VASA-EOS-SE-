import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"

import { createProject, scoreProject, getProject, deleteProject, listProjects } from "@/lib/sciencefair/store"
import { createRecord, getRecord, deleteRecord, listRecords } from "@/lib/fitness/store"
import { createReader, promoteReader, logBook, getReader, deleteReader, listReaders } from "@/lib/reading/store"

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

test("science-fair: register, score (clamped + marks judged), delete via the DB path", async () => {
  const p = await createProject({ title: "Water filter", student: "Aarthi", cls: "9A", category: "Environment" })
  assert.equal(p.judged, false)
  const scored = await scoreProject(p.id, 150) // clamps to 100
  assert.equal(scored?.score, 100)
  assert.equal(scored?.judged, true)
  assert.equal((await scoreProject(p.id, -5))?.score, 0) // clamps to 0
  assert.equal((await getProject(p.id))?.judged, true)
  assert.ok((await listProjects()).some((x) => x.id === p.id))
  assert.equal(await deleteProject(p.id), true)
  assert.equal(await scoreProject("missing", 50), undefined)
})

test("fitness: record (grade derived from score), list, delete via the DB path", async () => {
  const a = await createRecord({ student: "A", cls: "7A", test: "BMI / body composition", score: 80 })
  assert.equal(a.grade, "Excellent")
  const b = await createRecord({ student: "B", cls: "7A", test: "Speed (50m dash)", score: 30 })
  assert.equal(b.grade, "Needs improvement")
  assert.equal((await getRecord(a.id))?.grade, "Excellent")
  assert.equal((await listRecords()).length, 2)
  assert.equal(await deleteRecord(a.id), true)
})

test("reading: add, promote band, log book, delete via the DB path", async () => {
  const r = await createReader({ student: "Meena", cls: "3A", level: "Word" })
  assert.equal(r.booksRead, 0)
  assert.equal((await promoteReader(r.id))?.level, "Paragraph")
  assert.equal((await promoteReader(r.id))?.level, "Story")
  assert.equal((await logBook(r.id))?.booksRead, 1)
  assert.equal((await logBook(r.id))?.booksRead, 2)
  assert.equal((await getReader(r.id))?.booksRead, 2)
  assert.ok((await listReaders()).some((x) => x.id === r.id))
  assert.equal(await deleteReader(r.id), true)
  assert.equal(await promoteReader("missing"), undefined)
})

test("in-memory fallback works for all three when no DB is configured", async () => {
  __setTestDb(null)
  const p = await createProject({ title: "T", student: "S", cls: "9B", category: "Physics" })
  assert.equal((await scoreProject(p.id, 75))?.score, 75)
  const rec = await createRecord({ student: "C", cls: "8A", test: "Flexibility (sit & reach)", score: 55 })
  assert.equal(rec.grade, "Healthy")
  const rd = await createReader({ student: "D", cls: "2A", level: "Beginner" })
  assert.equal((await promoteReader(rd.id))?.level, "Letter")
  assert.ok((await listProjects()).some((x) => x.id === p.id))
})
