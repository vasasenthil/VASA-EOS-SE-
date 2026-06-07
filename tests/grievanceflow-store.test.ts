import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { act, startInstance } from "@/lib/workflow"
import { GRIEVANCE_ESCALATION } from "@/lib/workflow/definitions"
import { fileGrievanceFlow, actOnGrievance, getGrievanceFlow, deleteGrievanceFlow, listGrievanceFlows } from "@/lib/grievanceflow/store"
import { recordEntry, getEntry, deleteEntry, listEntries } from "@/lib/mdm/store"
import { addBeneficiary, advanceBeneficiary, deleteBeneficiary, listBeneficiaries } from "@/lib/scholarship/store"

const at = "2026-06-06T00:00:00.000Z"

test("engine: resolve closes the instance at any tier (not just the last)", () => {
  let inst = startInstance(GRIEVANCE_ESCALATION, {}, "g")
  const r = act(GRIEVANCE_ESCALATION, inst, { actorRole: "PRINCIPAL", actor: "HM", decision: "resolve", at })
  assert.equal(r.ok, true)
  assert.equal(r.instance.status, "approved") // resolved at tier 1
})

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

test("grievance: escalate School -> Block -> District, then resolve (DB path)", async () => {
  const rec = await fileGrievanceFlow({ applicant: "Parent", category: "Fees", description: "overcharged" })
  // Principal escalates (approve) to BEO.
  let res = await actOnGrievance(rec.id, { actorRole: "PRINCIPAL", actor: "HM", decision: "approve" })
  assert.equal(res.record?.instance.status, "in_progress")
  // BEO can't be skipped by DEO acting early.
  assert.equal((await actOnGrievance(rec.id, { actorRole: "DEO", actor: "d", decision: "resolve" })).ok, false)
  // BEO resolves at the block tier.
  res = await actOnGrievance(rec.id, { actorRole: "BEO", actor: "b", decision: "resolve" })
  assert.equal(res.record?.instance.status, "approved")
  assert.ok((await getGrievanceFlow(rec.id))?.instance.status === "approved")
  assert.ok((await listGrievanceFlows()).some((x) => x.id === rec.id))
  assert.equal(await deleteGrievanceFlow(rec.id), true)
})

test("mdm: record daily entry, get, delete (DB path) + in-memory", async () => {
  const e = await recordEntry({ date: "2026-06-05", enrolment: 60, present: 54, mealsServed: 54, menu: "rice" })
  assert.equal((await getEntry(e.id))?.present, 54)
  assert.ok((await listEntries()).some((x) => x.id === e.id))
  assert.equal(await deleteEntry(e.id), true)
  __setTestDb(null)
  const e2 = await recordEntry({ date: "2026-06-06", enrolment: 50, present: 48, mealsServed: 60, menu: "x" })
  assert.ok((await listEntries()).some((x) => x.id === e2.id))
})

test("scholarship: add + advance pipeline; seeded ledger in-memory", async () => {
  const r = await addBeneficiary({ name: "New Student", scheme: "Pudhumai Penn", amount: 12000 })
  assert.equal(r.status, "eligible")
  assert.equal((await advanceBeneficiary(r.id))?.status, "applied")
  assert.equal((await advanceBeneficiary(r.id))?.status, "sanctioned")
  assert.ok((await listBeneficiaries()).some((x) => x.id === r.id))
  assert.equal(await deleteBeneficiary(r.id), true)

  __setTestDb(null)
  assert.ok((await listBeneficiaries()).length >= 6) // seeded demo ledger
})
