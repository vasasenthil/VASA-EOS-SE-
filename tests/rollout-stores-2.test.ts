import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"

import { createStudent, reviewStudent, getStudent, deleteStudent, listStudents } from "@/lib/cwsn/store"
import { createApplicant, advanceApplicant, getApplicant, deleteApplicant, listApplicants } from "@/lib/rte/store"
import { createRti, advanceRti, getRti, deleteRti, listRti } from "@/lib/rti/store"

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

test("cwsn: register, review, get, delete via the DB path (supports array round-trips)", async () => {
  const st = await createStudent({ name: "Meena", cls: "5A", disability: "Hearing impairment", supports: ["Scribe / reader", "Extra examination time"], iepGoal: "Read 60 wpm" })
  assert.equal(st.reviewed, false)
  assert.deepEqual((await getStudent(st.id))?.supports, ["Scribe / reader", "Extra examination time"])
  assert.equal((await reviewStudent(st.id))?.reviewed, true)
  assert.ok((await listStudents()).some((x) => x.id === st.id))
  assert.equal(await deleteStudent(st.id), true)
  assert.equal(await reviewStudent("missing"), undefined)
})

test("rte: apply, advance through stages, delete via the DB path", async () => {
  const a = await createApplicant({ name: "Kavya", category: "EWS (economically weaker)" })
  assert.equal(a.status, "applied")
  assert.equal((await advanceApplicant(a.id))?.status, "verified")
  assert.equal((await advanceApplicant(a.id))?.status, "allotted")
  assert.equal((await advanceApplicant(a.id))?.status, "admitted")
  assert.equal((await getApplicant(a.id))?.status, "admitted")
  assert.equal(await deleteApplicant(a.id), true)
  assert.equal(await advanceApplicant("missing"), undefined)
})

test("rti: log, advance to replied, delete via the DB path", async () => {
  const r = await createRti({ applicant: "Citizen", subject: "Sanctioned strength", receivedDate: "2026-06-01" })
  assert.equal(r.status, "received")
  assert.equal((await advanceRti(r.id))?.status, "under_process")
  assert.equal((await advanceRti(r.id))?.status, "replied")
  assert.equal((await getRti(r.id))?.status, "replied")
  assert.ok((await listRti()).some((x) => x.id === r.id))
  assert.equal(await deleteRti(r.id), true)
  assert.equal(await advanceRti("missing"), undefined)
})

test("in-memory fallback works for all three when no DB is configured", async () => {
  __setTestDb(null)
  const st = await createStudent({ name: "X", cls: "1A", disability: "Autism spectrum", supports: [], iepGoal: "" })
  assert.equal((await reviewStudent(st.id))?.reviewed, true)
  const a = await createApplicant({ name: "Y", category: "SC" })
  assert.equal((await advanceApplicant(a.id))?.status, "verified")
  const r = await createRti({ applicant: "Z", subject: "Q", receivedDate: "2026-06-02" })
  assert.equal((await advanceRti(r.id))?.status, "under_process")
  assert.ok((await listStudents()).some((x) => x.id === st.id))
})
