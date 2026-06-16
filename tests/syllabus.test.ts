import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { summarise, ON_TRACK_PCT, type SyllabusProgress } from "@/lib/syllabus"
import { addSyllabusSubject, setSyllabusPct, listSyllabus, DEMO_UDISE } from "@/lib/syllabus/store"

function rows(): SyllabusProgress[] {
  return [
    { subject: "Mathematics", teacher: "Mr. Sharma", pct: 78 },
    { subject: "Social Studies", teacher: "Mr. Khan", pct: 74 },
    { subject: "English", teacher: "Ms. Verma", pct: 91 },
  ]
}

test("summarise computes average completion (1dp) and counts subjects behind", () => {
  const s = summarise(rows())
  assert.equal(s.subjects, 3)
  assert.equal(s.avgPct, 81) // (78+74+91)/3 = 81
  assert.equal(s.behind, 1) // only Social Studies (74) is below 75
})

test("an empty syllabus summarises to zeroes, not NaN", () => {
  assert.deepEqual(summarise([]), { subjects: 0, avgPct: 0, behind: 0 })
})

test("the on-track threshold is stable", () => {
  assert.equal(ON_TRACK_PCT, 75)
})

test("listing orders subjects by completion, lowest first (DB path)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  await addSyllabusSubject({ subject: "English", teacher: "V", pct: 91 })
  await addSyllabusSubject({ subject: "Social Studies", teacher: "K", pct: 74 })
  await addSyllabusSubject({ subject: "Maths", teacher: "S", pct: 78 })
  const got = await listSyllabus()
  assert.deepEqual(got.map((r) => r.subject), ["Social Studies", "Maths", "English"])
  __setTestDb(undefined)
})

test("a subject's completion can be updated (DB path)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const rec = await addSyllabusSubject({ subject: "Science", teacher: "R", pct: 60 })
  assert.equal(await setSyllabusPct(rec.id, 85), true)
  const got = await listSyllabus()
  assert.equal(got.find((r) => r.id === rec.id)?.pct, 85)
  __setTestDb(undefined)
})

test("in-memory fallback is seeded and scoped; updating a missing id is false", async () => {
  __setTestDb(null)
  const got = await listSyllabus(DEMO_UDISE)
  assert.equal(got.length, 5)
  assert.equal(got[0].subject, "Social Studies") // lowest completion leads (74)
  assert.equal(await setSyllabusPct("SYL-NONE", 50), false)
  assert.equal((await listSyllabus("00000000000")).length, 0)
})
