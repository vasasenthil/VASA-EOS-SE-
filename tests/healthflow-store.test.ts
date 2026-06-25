import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { fileReferral, actOnReferral, getReferral, deleteReferral, listReferrals } from "@/lib/healthflow/store"
import { scopeRecords, SCOPE_TENANTS, DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

test("a filed referral carries a tenant (defaults to the demo school) and a live instance (DB path)", async () => {
  const rec = await fileReferral({ student: "R. Murugan", category: "Diseases", specialistReferral: false })
  assert.equal(rec.tenantId, DEFAULT_SCHOOL_NODE)
  assert.equal(rec.instance.status, "in_progress")
  const got = await getReferral(rec.id)
  assert.equal(got?.tenantId, DEFAULT_SCHOOL_NODE)
})

test("a referral can be filed at a specific school tenant (DB path)", async () => {
  const rec = await fileReferral({ student: "S. Devi", category: "Developmental delays", specialistReferral: true, tenantId: "TN-CHN-B2-S1" })
  assert.equal(rec.tenantId, "TN-CHN-B2-S1")
})

test("scoping by jurisdiction: a school sees only its own referrals; the district sees both", async () => {
  await fileReferral({ student: "A", category: "Diseases", specialistReferral: false, tenantId: "TN-CHN-B1-S1" })
  await fileReferral({ student: "B", category: "Diseases", specialistReferral: false, tenantId: "TN-CHN-B2-S1" })
  const all = await listReferrals()
  // The store list is unscoped; the action applies scopeForCurrentSubject. Verify the pure rule:
  assert.equal(scopeRecords(SCOPE_TENANTS, "TN-CHN-B1-S1", all).length, 1) // S1 sees only its own
  assert.equal(scopeRecords(SCOPE_TENANTS, "TN-CHN", all).length, 2) // Chennai district sees both
  assert.equal(scopeRecords(SCOPE_TENANTS, "TN-CHN-B2-S2", all).length, 0) // an unrelated school sees none
})

test("the referral workflow advances School -> Block -> (DEIC for specialist) and audits", async () => {
  const rec = await fileReferral({ student: "C", category: "Vision", specialistReferral: true })
  let r = await actOnReferral(rec.id, { actorRole: "PRINCIPAL", actor: "hm", decision: "approve" })
  assert.equal(r.record?.instance.status, "in_progress")
  r = await actOnReferral(rec.id, { actorRole: "BEO", actor: "bmo", decision: "approve" })
  assert.equal(r.record?.instance.status, "in_progress") // specialist case still needs DEIC
  r = await actOnReferral(rec.id, { actorRole: "DEO", actor: "deic", decision: "approve" })
  assert.equal(r.record?.instance.status, "approved")
  assert.equal(await deleteReferral(rec.id), true)
})

test("in-memory fallback works and acting on an unknown referral fails cleanly", async () => {
  __setTestDb(null)
  const rec = await fileReferral({ student: "D", category: "Diseases", specialistReferral: false })
  assert.ok((await listReferrals()).some((x) => x.id === rec.id))
  assert.equal((await actOnReferral("HR-NOPE", { actorRole: "PRINCIPAL", actor: "x", decision: "approve" })).ok, false)
})
