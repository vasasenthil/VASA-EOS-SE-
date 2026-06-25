import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { fileIncident, actOnIncident, getIncident, deleteIncident, listIncidents } from "@/lib/safetyflow/store"
import { scopeRecords, SCOPE_TENANTS, DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

test("a filed incident carries a tenant (defaults to the demo school) and only an anonymised ref (DB path)", async () => {
  const rec = await fileIncident({ caseRef: "SI-CASE-001", category: "Safety", escalate: false })
  assert.equal(rec.tenantId, DEFAULT_SCHOOL_NODE)
  assert.equal(rec.caseRef, "SI-CASE-001") // anonymised reference, no victim identity
  assert.equal(rec.instance.status, "in_progress")
  assert.equal((await getIncident(rec.id))?.tenantId, DEFAULT_SCHOOL_NODE)
})

test("scoping by jurisdiction: a school sees only its own cases; the district sees both", async () => {
  await fileIncident({ caseRef: "C1", category: "Safety", escalate: false, tenantId: "TN-CHN-B1-S1" })
  await fileIncident({ caseRef: "C2", category: "Safety", escalate: true, tenantId: "TN-CHN-B2-S1" })
  const all = await listIncidents()
  assert.equal(scopeRecords(SCOPE_TENANTS, "TN-CHN-B1-S1", all).length, 1) // S1 sees only its own
  assert.equal(scopeRecords(SCOPE_TENANTS, "TN-CHN", all).length, 2) // Chennai district sees both
  assert.equal(scopeRecords(SCOPE_TENANTS, "TN-CHN-B2-S2", all).length, 0) // an unrelated school sees none
})

test("the incident workflow advances School -> Block -> (DCPU for escalation) and audits", async () => {
  const rec = await fileIncident({ caseRef: "C3", category: "Safety", escalate: true })
  let r = await actOnIncident(rec.id, { actorRole: "PRINCIPAL", actor: "hm", decision: "approve" })
  assert.equal(r.record?.instance.status, "in_progress")
  r = await actOnIncident(rec.id, { actorRole: "BEO", actor: "block", decision: "approve" })
  assert.equal(r.record?.instance.status, "in_progress") // escalated case still needs DCPU
  r = await actOnIncident(rec.id, { actorRole: "DEO", actor: "dcpu", decision: "approve" })
  assert.equal(r.record?.instance.status, "approved")
  assert.equal(await deleteIncident(rec.id), true)
})

test("in-memory fallback works and acting on an unknown incident fails cleanly", async () => {
  __setTestDb(null)
  const rec = await fileIncident({ caseRef: "C4", category: "Safety", escalate: false })
  assert.ok((await listIncidents()).some((x) => x.id === rec.id))
  assert.equal((await actOnIncident("SI-NOPE", { actorRole: "PRINCIPAL", actor: "x", decision: "approve" })).ok, false)
})
