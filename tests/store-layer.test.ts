import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"

import {
  fileGrievance,
  escalateGrievance,
  resolveGrievance,
  listGrievances,
  getGrievance,
  updateGrievance,
  deleteGrievance,
} from "@/lib/grievance/store"
import { createProposal, vote, listProposals } from "@/lib/smc/store"
import { proposalStatus } from "@/lib/smc"
import { fileApplication, advanceApplication, rejectApplication, listApplications } from "@/lib/recognition/store"
import { mintCredential, listCredentials, verifyById } from "@/lib/credentials/store"
import { grantConsent, withdrawConsent, listConsents, hasConsent } from "@/lib/consent/store"

beforeEach(() => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
})
afterEach(() => {
  __setTestDb(undefined)
})

test("grievance: file, persist, escalate and resolve via the DB path", async () => {
  const g = await fileGrievance({ category: "Fees", description: "Overcharged" })
  const listed = await listGrievances()
  assert.ok(listed.find((x) => x.id === g.id))

  const esc = await escalateGrievance(g.id)
  assert.equal(esc?.status, "escalated")
  assert.equal(esc?.tier, 1)

  const res = await resolveGrievance(g.id)
  assert.equal(res?.status, "resolved")
})

test("grievance: full CRUD — get, update and delete via the DB path", async () => {
  const g = await fileGrievance({ category: "Fees", description: "Wrong amount" })

  const fetched = await getGrievance(g.id)
  assert.equal(fetched?.id, g.id)

  const updated = await updateGrievance(g.id, { description: "Corrected amount", category: "Scheme / DBT" })
  assert.equal(updated?.description, "Corrected amount")
  assert.equal(updated?.category, "Scheme / DBT")
  assert.equal((await getGrievance(g.id))?.description, "Corrected amount")

  assert.equal(await deleteGrievance(g.id), true)
  assert.equal(await getGrievance(g.id), undefined)
  assert.equal(await deleteGrievance(g.id), false)
})

test("SMC: create a proposal and tally votes via the DB path", async () => {
  const p = await createProposal({ title: "Repair grant", description: "₹40,000" })
  await vote({ id: p.id, support: true })
  const updated = await vote({ id: p.id, support: false })
  assert.equal(updated?.votesFor, 1)
  assert.equal(updated?.votesAgainst, 1)
  const listed = await listProposals()
  assert.ok(listed.find((x) => x.id === p.id))
  assert.equal(proposalStatus({ ...p, votesFor: 7, votesAgainst: 1 }), "passed")
})

test("recognition: file, advance through stages and reject via the DB path", async () => {
  const a = await fileApplication({ school: "Test School", district: "Chennai", type: "new" })
  assert.equal(a.stageIndex, 0)

  const adv = await advanceApplication(a.id)
  assert.equal(adv?.stageIndex, 1)
  assert.equal(adv?.status, "in_progress")

  const listed = await listApplications()
  assert.ok(listed.find((x) => x.id === a.id))

  const rej = await rejectApplication(a.id, "norms not met")
  assert.equal(rej?.status, "rejected")
})

test("recognition: advancing to the final stage marks it recognised", async () => {
  const a = await fileApplication({ school: "Path School", district: "Salem", type: "renewal" })
  let cur = a
  for (let i = 0; i < 10 && cur.status === "in_progress"; i++) {
    cur = (await advanceApplication(a.id))!
  }
  assert.equal(cur.status, "recognised")
})

test("credentials: mint, list and verify via the DB path", async () => {
  const c = await mintCredential({ apaarId: "APAAR-1", kind: "badge", title: "Numeracy", issuer: "DGE-TN" })
  const listed = await listCredentials()
  assert.ok(listed.find((x) => x.id === c.id))
  const v = await verifyById(c.id)
  assert.equal(v.valid, true)
  assert.equal((await verifyById("missing")).valid, false)
})

test("consent: grant, list, effective state and withdraw via the DB path", async () => {
  await grantConsent({ subjectApaar: "APAAR-2", purpose: "analytics", actor: "guardian" })
  assert.equal(await hasConsent("APAAR-2", "analytics"), true)

  const records = await listConsents("APAAR-2")
  assert.equal(records.length, 1)

  await withdrawConsent({ subjectApaar: "APAAR-2", purpose: "analytics", actor: "guardian" })
  assert.equal(await hasConsent("APAAR-2", "analytics"), false)
})
