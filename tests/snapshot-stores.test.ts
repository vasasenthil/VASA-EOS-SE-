import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { saveRound, getRound, deleteRound, listRounds } from "@/lib/diagnostic/store"
import { publishResults, getPublication, deletePublication, listPublications } from "@/lib/results/store"

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

test("diagnostic: save a round snapshot (scores + summary), get, delete (DB path)", async () => {
  const summary = { total: 2, atGrade: 1, oneBelow: 1, twoBelow: 0, avgScore: 55 }
  const r = await saveRound({ date: "2026-06-06", label: "Baseline", scores: { a: 70, b: 40 }, summary })
  const got = await getRound(r.id)
  assert.equal(got?.label, "Baseline")
  assert.deepEqual(got?.scores, { a: 70, b: 40 })
  assert.equal(got?.summary.avgScore, 55)
  assert.ok((await listRounds()).some((x) => x.id === r.id))
  assert.equal(await deleteRound(r.id), true)
})

test("results: publish a snapshot, get, delete (DB path)", async () => {
  const p = await publishResults({ examName: "Half-yearly", candidates: 30, passPct: 80 })
  assert.equal((await getPublication(p.id))?.examName, "Half-yearly")
  assert.equal((await getPublication(p.id))?.passPct, 80)
  assert.ok((await listPublications()).some((x) => x.id === p.id))
  assert.equal(await deletePublication(p.id), true)
})

test("in-memory fallback works for both snapshot stores", async () => {
  __setTestDb(null)
  const r = await saveRound({ date: "2026-06-07", label: "Endline", scores: {}, summary: { total: 0, atGrade: 0, oneBelow: 0, twoBelow: 0, avgScore: 0 } })
  assert.ok((await listRounds()).some((x) => x.id === r.id))
  const p = await publishResults({ examName: "Annual", candidates: 10, passPct: 90 })
  assert.ok((await listPublications()).some((x) => x.id === p.id))
})
