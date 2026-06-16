import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { fileScholarship, actOnScholarship, getScholarship, deleteScholarship, listScholarships } from "@/lib/scholarshipflow/store"
import { scopeRecords, SCOPE_TENANTS, DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

test("a filed application carries a tenant (defaults to the demo school) and a live instance (DB path)", async () => {
  const rec = await fileScholarship({ student: "K. Lakshmi", scheme: "Pudhumai Penn", amount: 12000, details: { accountMasked: "••••1234" } })
  assert.equal(rec.tenantId, DEFAULT_SCHOOL_NODE)
  assert.equal(rec.details?.accountMasked, "••••1234") // masked DBT account only
  assert.equal(rec.instance.status, "in_progress")
  assert.equal((await getScholarship(rec.id))?.tenantId, DEFAULT_SCHOOL_NODE)
})

test("scoping by jurisdiction: a school sees only its own applications; the district sees both", async () => {
  await fileScholarship({ student: "A", scheme: "MTS", amount: 5000, tenantId: "TN-CHN-B1-S1" })
  await fileScholarship({ student: "B", scheme: "MTS", amount: 5000, tenantId: "TN-CHN-B2-S1" })
  const all = await listScholarships()
  assert.equal(scopeRecords(SCOPE_TENANTS, "TN-CHN-B1-S1", all).length, 1) // S1 sees only its own
  assert.equal(scopeRecords(SCOPE_TENANTS, "TN-CHN", all).length, 2) // Chennai district sees both
  assert.equal(scopeRecords(SCOPE_TENANTS, "TN-CHN-B2-S2", all).length, 0) // an unrelated school sees none
})

test("the sanction workflow advances HM -> BEO -> (DEO scrutiny for high value) -> DBT release", async () => {
  const rec = await fileScholarship({ student: "C", scheme: "Merit", amount: 30000 }) // >= 25000 -> DEO scrutiny
  let r = await actOnScholarship(rec.id, { actorRole: "PRINCIPAL", actor: "hm", decision: "approve" })
  assert.equal(r.record?.instance.status, "in_progress")
  r = await actOnScholarship(rec.id, { actorRole: "BEO", actor: "beo", decision: "approve" })
  assert.equal(r.record?.instance.status, "in_progress") // high value still needs DEO scrutiny
  r = await actOnScholarship(rec.id, { actorRole: "DEO", actor: "deo", decision: "approve" }) // scrutiny
  assert.equal(r.record?.instance.status, "in_progress")
  r = await actOnScholarship(rec.id, { actorRole: "DEO", actor: "treasury", decision: "approve" }) // DBT release
  assert.equal(r.record?.instance.status, "approved")
  assert.equal(await deleteScholarship(rec.id), true)
})

test("in-memory fallback works and acting on an unknown application fails cleanly", async () => {
  __setTestDb(null)
  const rec = await fileScholarship({ student: "D", scheme: "MTS", amount: 5000 })
  assert.ok((await listScholarships()).some((x) => x.id === rec.id))
  assert.equal((await actOnScholarship("SCH-NOPE", { actorRole: "PRINCIPAL", actor: "x", decision: "approve" })).ok, false)
})
