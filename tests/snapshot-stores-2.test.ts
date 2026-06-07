import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { savePlan, listPlans } from "@/lib/exam-seating/store"
import { savePaper, listPapers } from "@/lib/question-bank/store"
import { saveRun, listRuns } from "@/lib/promotion/store"

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

test("exam-seating: save a plan snapshot, list (DB path)", async () => {
  const p = await savePlan({ label: "Half-yearly", candidates: 120, seated: 120, unseated: 0 })
  assert.equal(p.candidates, 120)
  assert.ok((await listPlans()).some((x) => x.id === p.id))
})

test("question-bank: save a paper snapshot (count derived from ids), list", async () => {
  const p = await savePaper({ title: "Term 1", questionIds: ["q1", "q2", "q3"], totalMarks: 15 })
  assert.equal(p.count, 3)
  assert.equal(p.totalMarks, 15)
  assert.ok((await listPapers()).some((x) => x.id === p.id))
})

test("promotion: save a run snapshot from a summary, list", async () => {
  const r = await saveRun({ label: "AY26", summary: { total: 40, promoted: 35, detained: 3, graduated: 2 } })
  assert.equal(r.promoted, 35)
  assert.equal(r.graduated, 2)
  assert.ok((await listRuns()).some((x) => x.id === r.id))
})

test("in-memory fallback works for all three snapshot stores", async () => {
  __setTestDb(null)
  const a = await savePlan({ label: "x", candidates: 10, seated: 10, unseated: 0 })
  const b = await savePaper({ title: "y", questionIds: ["q1"], totalMarks: 5 })
  const c = await saveRun({ label: "z", summary: { total: 1, promoted: 1, detained: 0, graduated: 0 } })
  assert.ok((await listPlans()).some((x) => x.id === a.id))
  assert.ok((await listPapers()).some((x) => x.id === b.id))
  assert.ok((await listRuns()).some((x) => x.id === c.id))
})
