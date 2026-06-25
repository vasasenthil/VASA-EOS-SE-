import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"

import { createEnrolment, certifyEnrolment, getEnrolment, deleteEnrolment, listEnrolments } from "@/lib/vocational/store"
import { createCandidate, voteCandidate, declareElection, deleteCandidate, listCandidates } from "@/lib/council/store"
import { createActivity, getActivity, deleteActivity, listActivities } from "@/lib/bagless/store"

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

test("vocational: enrol, certify, delete via the DB path", async () => {
  const e = await createEnrolment({ student: "Arun", trade: "IT / ITeS", level: 2 })
  assert.equal(e.certified, false)
  assert.equal((await certifyEnrolment(e.id))?.certified, true)
  assert.equal((await getEnrolment(e.id))?.certified, true)
  assert.ok((await listEnrolments()).some((x) => x.id === e.id))
  assert.equal(await deleteEnrolment(e.id), true)
  assert.equal(await certifyEnrolment("missing"), undefined)
})

test("council: nominate, vote, declare winner per position via the DB path", async () => {
  const a = await createCandidate({ name: "A", cls: "8A", position: "School Pupil Leader" })
  const b = await createCandidate({ name: "B", cls: "8B", position: "School Pupil Leader" })
  await voteCandidate(a.id)
  await voteCandidate(a.id)
  assert.equal((await voteCandidate(b.id))?.votes, 1)

  const roster = await declareElection()
  const winner = roster.find((c) => c.id === a.id)
  const loser = roster.find((c) => c.id === b.id)
  assert.equal(winner?.elected, true)
  assert.equal(loser?.elected, false)

  assert.equal(await deleteCandidate(b.id), true)
  assert.ok((await listCandidates()).some((x) => x.id === a.id))
})

test("bagless: log activity, get, delete via the DB path", async () => {
  const act = await createActivity({ title: "Potter visit", type: "Local craft / artisan", date: "2026-06-05", classGroup: "6-8", participants: 40 })
  assert.equal((await getActivity(act.id))?.participants, 40)
  assert.ok((await listActivities()).some((x) => x.id === act.id))
  assert.equal(await deleteActivity(act.id), true)
  assert.equal(await getActivity(act.id), undefined)
})

test("in-memory fallback works for all three when no DB is configured", async () => {
  __setTestDb(null)
  const e = await createEnrolment({ student: "Z", trade: "Healthcare", level: 1 })
  assert.equal((await certifyEnrolment(e.id))?.certified, true)
  const c = await createCandidate({ name: "C", cls: "7A", position: "Sports Captain" })
  await voteCandidate(c.id)
  assert.equal((await declareElection()).find((x) => x.id === c.id)?.elected, true)
  const act = await createActivity({ title: "Garden", type: "Kitchen gardening", date: "2026-06-06", classGroup: "All", participants: 20 })
  assert.ok((await listActivities()).some((x) => x.id === act.id))
})
