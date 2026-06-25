import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { fileLeaveFlow, actOnLeave, getLeaveFlow, deleteLeaveFlow, listLeaveFlows } from "@/lib/leaveflow/store"

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

test("short leave (<=5d): Principal approval completes it (DB path)", async () => {
  const rec = await fileLeaveFlow({ teacher: "A", type: "casual", from: "2026-06-10", to: "2026-06-11", reason: "x" })
  assert.equal(rec.days, 2)
  const res = await actOnLeave(rec.id, { actorRole: "PRINCIPAL", actor: "HM", decision: "approve" })
  assert.equal(res.ok, true)
  assert.equal(res.record?.instance.status, "approved")
})

test("long leave (>15d) routes Principal -> BEO -> DEO; role-gating enforced", async () => {
  const rec = await fileLeaveFlow({ teacher: "B", type: "earned", from: "2026-06-01", to: "2026-06-25", reason: "y" })
  assert.equal(rec.days, 25)

  // Wrong role can't act.
  const bad = await actOnLeave(rec.id, { actorRole: "BEO", actor: "B", decision: "approve" })
  assert.equal(bad.ok, false)

  let res = await actOnLeave(rec.id, { actorRole: "PRINCIPAL", actor: "HM", decision: "approve" })
  assert.equal(res.record?.instance.status, "in_progress")
  res = await actOnLeave(rec.id, { actorRole: "BEO", actor: "Beo", decision: "approve" })
  assert.equal(res.record?.instance.status, "in_progress")
  res = await actOnLeave(rec.id, { actorRole: "DEO", actor: "Deo", decision: "approve" })
  assert.equal(res.record?.instance.status, "approved")
  assert.equal(res.record?.instance.history.length, 3) // wrong-role act was rejected and not recorded
})

test("reject terminates; list + delete (DB path)", async () => {
  const rec = await fileLeaveFlow({ teacher: "C", type: "medical", from: "2026-06-01", to: "2026-06-10", reason: "z" })
  const res = await actOnLeave(rec.id, { actorRole: "PRINCIPAL", actor: "HM", decision: "reject", note: "incomplete" })
  assert.equal(res.record?.instance.status, "rejected")
  assert.ok((await listLeaveFlows()).some((x) => x.id === rec.id))
  assert.equal((await getLeaveFlow(rec.id))?.instance.status, "rejected")
  assert.equal(await deleteLeaveFlow(rec.id), true)
  assert.equal((await actOnLeave("missing", { actorRole: "PRINCIPAL", actor: "x", decision: "approve" })).ok, false)
})

test("in-memory fallback works end to end", async () => {
  __setTestDb(null)
  const rec = await fileLeaveFlow({ teacher: "D", type: "casual", from: "2026-06-01", to: "2026-06-08", reason: "" })
  assert.equal(rec.days, 8) // > 5 → needs BEO too
  let res = await actOnLeave(rec.id, { actorRole: "PRINCIPAL", actor: "HM", decision: "approve" })
  assert.equal(res.record?.instance.status, "in_progress")
  res = await actOnLeave(rec.id, { actorRole: "BEO", actor: "Beo", decision: "approve" })
  assert.equal(res.record?.instance.status, "approved")
})
