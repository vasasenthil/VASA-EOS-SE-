import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { fileTc, actOnTc, getTc, deleteTc, listTcs } from "@/lib/tcflow/store"

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

test("TC (inter-state): Class Teacher -> Headmaster -> Block counter-sign (DB path)", async () => {
  const rec = await fileTc({
    student: "Kavya R.",
    needsCountersign: true,
    details: { apaarId: "100200300401", udiseCode: "33010100101", lastClass: "VIII", tcType: "Original — inter-state" },
  })
  // The Headmaster cannot sign before the class teacher verifies the record.
  assert.equal((await actOnTc(rec.id, { actorRole: "PRINCIPAL", actor: "hm", decision: "approve" })).ok, false)
  let r = await actOnTc(rec.id, { actorRole: "ACADEMIC_HEAD", actor: "ct", decision: "approve" })
  assert.equal(r.record?.instance.status, "in_progress")
  r = await actOnTc(rec.id, { actorRole: "PRINCIPAL", actor: "hm", decision: "approve" })
  assert.equal(r.record?.instance.status, "in_progress") // still needs Block counter-sign
  r = await actOnTc(rec.id, { actorRole: "BEO", actor: "beo", decision: "approve" })
  assert.equal(r.record?.instance.status, "approved")
  assert.equal((await getTc(rec.id))?.instance.status, "approved")
})

test("TC (within TN): the Block counter-signature is skipped", async () => {
  const rec = await fileTc({
    student: "Arjun M.",
    needsCountersign: false,
    details: { apaarId: "100200300402", udiseCode: "33010100101", lastClass: "V", tcType: "Original — within Tamil Nadu" },
  })
  let r = await actOnTc(rec.id, { actorRole: "ACADEMIC_HEAD", actor: "ct", decision: "approve" })
  assert.equal(r.record?.instance.status, "in_progress")
  // Headmaster signature is the final step — Block counter-sign is skipped.
  r = await actOnTc(rec.id, { actorRole: "PRINCIPAL", actor: "hm", decision: "approve" })
  assert.equal(r.record?.instance.status, "approved")
  assert.ok((await listTcs()).some((x) => x.id === rec.id))
})

test("TC: a rejection terminates the flow; delete removes it (DB path)", async () => {
  const rec = await fileTc({ student: "X", needsCountersign: false })
  const rj = await actOnTc(rec.id, { actorRole: "ACADEMIC_HEAD", actor: "ct", decision: "reject" })
  assert.equal(rj.record?.instance.status, "rejected")
  assert.equal(await deleteTc(rec.id), true)
  assert.equal(await getTc(rec.id), undefined)
})

test("TC: acting on an unknown request fails cleanly", async () => {
  const r = await actOnTc("TC-NOPE", { actorRole: "ACADEMIC_HEAD", actor: "x", decision: "approve" })
  assert.equal(r.ok, false)
})

test("TC: in-memory fallback works", async () => {
  __setTestDb(null)
  const rec = await fileTc({ student: "In-memory", needsCountersign: true })
  assert.equal((await actOnTc(rec.id, { actorRole: "ACADEMIC_HEAD", actor: "ct", decision: "approve" })).record?.instance.status, "in_progress")
  assert.ok((await listTcs()).some((x) => x.id === rec.id))
})
