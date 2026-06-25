import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { fileBudget, actOnBudget, getBudget, deleteBudget, listBudgets } from "@/lib/budgetflow/store"

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

test("Budget (Cabinet-bound): Director -> Secretary -> Minister sequential (DB path)", async () => {
  const rec = await fileBudget({
    scheme: "New STEM labs scheme",
    amount: 600000000,
    needsCabinet: true,
    details: { proposalType: "Fresh sanction", budgetHead: "4202 — Capital Outlay (Education)", fiscalYear: "2026-27" },
  })
  // Not the Secretary's turn first — the Directorate proposes.
  assert.equal((await actOnBudget(rec.id, { actorRole: "SECRETARY", actor: "s", decision: "approve" })).ok, false)
  let r = await actOnBudget(rec.id, { actorRole: "DIRECTOR", actor: "dir", decision: "approve" })
  assert.equal(r.record?.instance.status, "in_progress")
  r = await actOnBudget(rec.id, { actorRole: "SECRETARY", actor: "sec", decision: "approve" })
  assert.equal(r.record?.instance.status, "in_progress") // still needs Cabinet
  r = await actOnBudget(rec.id, { actorRole: "MINISTER", actor: "min", decision: "approve" })
  assert.equal(r.record?.instance.status, "approved")
  assert.equal((await getBudget(rec.id))?.instance.status, "approved")
})

test("Budget (Secretariat-level): the Cabinet step is skipped when not needed", async () => {
  const rec = await fileBudget({
    scheme: "Supplementary stationery grant",
    amount: 4000000,
    needsCabinet: false,
    details: { proposalType: "Supplementary", budgetHead: "2202-01 — Elementary Education", fiscalYear: "2026-27" },
  })
  let r = await actOnBudget(rec.id, { actorRole: "DIRECTOR", actor: "dir", decision: "approve" })
  assert.equal(r.record?.instance.status, "in_progress")
  // Secretariat scrutiny is the final step — Cabinet is skipped.
  r = await actOnBudget(rec.id, { actorRole: "SECRETARY", actor: "sec", decision: "approve" })
  assert.equal(r.record?.instance.status, "approved")
  assert.ok((await listBudgets()).some((x) => x.id === rec.id))
})

test("Budget: a rejection terminates the flow; delete removes it (DB path)", async () => {
  const rec = await fileBudget({ scheme: "Re-appropriation to adult education", amount: 1000000, needsCabinet: false })
  const rj = await actOnBudget(rec.id, { actorRole: "DIRECTOR", actor: "dir", decision: "reject" })
  assert.equal(rj.record?.instance.status, "rejected")
  assert.equal(await deleteBudget(rec.id), true)
  assert.equal(await getBudget(rec.id), undefined)
})

test("Budget: acting on an unknown proposal fails cleanly", async () => {
  const r = await actOnBudget("BS-NOPE", { actorRole: "DIRECTOR", actor: "x", decision: "approve" })
  assert.equal(r.ok, false)
})

test("Budget: in-memory fallback works", async () => {
  __setTestDb(null)
  const rec = await fileBudget({ scheme: "In-memory proposal", amount: 700000000, needsCabinet: true })
  assert.equal((await actOnBudget(rec.id, { actorRole: "DIRECTOR", actor: "dir", decision: "approve" })).record?.instance.status, "in_progress")
  assert.ok((await listBudgets()).some((x) => x.id === rec.id))
})
