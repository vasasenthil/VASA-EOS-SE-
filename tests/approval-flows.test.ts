import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { fileResolution, actOnResolution, getResolution, deleteResolution, listResolutions } from "@/lib/smcflow/store"
import { fileRecognition, actOnRecognition, getRecognition, deleteRecognition, listRecognitions } from "@/lib/recognitionflow/store"

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

test("SMC: quorum of 3 members then Principal counter-sign (DB path)", async () => {
  const rec = await fileResolution({ title: "Repair grant", description: "₹40,000" })
  for (let i = 0; i < 2; i++) {
    const r = await actOnResolution(rec.id, { actorRole: "PARENT", actor: `m${i}`, decision: "approve" })
    assert.equal(r.record?.instance.status, "in_progress") // still gathering quorum
  }
  let r = await actOnResolution(rec.id, { actorRole: "PARENT", actor: "m3", decision: "approve" })
  assert.equal(r.record?.instance.status, "in_progress") // quorum met, now needs chair
  // A member cannot counter-sign — only the Principal.
  assert.equal((await actOnResolution(rec.id, { actorRole: "PARENT", actor: "m4", decision: "approve" })).ok, false)
  r = await actOnResolution(rec.id, { actorRole: "PRINCIPAL", actor: "HM", decision: "approve" })
  assert.equal(r.record?.instance.status, "approved")
  assert.ok((await listResolutions()).some((x) => x.id === rec.id))
})

test("Recognition: BEO -> DEO -> Director sequential; reject terminates (DB path)", async () => {
  const rec = await fileRecognition({ school: "GHSS Egmore", district: "Chennai", type: "new" })
  assert.equal((await actOnRecognition(rec.id, { actorRole: "DEO", actor: "d", decision: "approve" })).ok, false) // not BEO's turn? BEO first
  let r = await actOnRecognition(rec.id, { actorRole: "BEO", actor: "b", decision: "approve" })
  assert.equal(r.record?.instance.status, "in_progress")
  r = await actOnRecognition(rec.id, { actorRole: "DEO", actor: "d", decision: "approve" })
  assert.equal(r.record?.instance.status, "in_progress")
  r = await actOnRecognition(rec.id, { actorRole: "DIRECTOR", actor: "dir", decision: "approve" })
  assert.equal(r.record?.instance.status, "approved")
  assert.equal((await getRecognition(rec.id))?.instance.status, "approved")

  const rec2 = await fileRecognition({ school: "X", district: "Y", type: "renewal" })
  const rj = await actOnRecognition(rec2.id, { actorRole: "BEO", actor: "b", decision: "reject" })
  assert.equal(rj.record?.instance.status, "rejected")
  assert.equal(await deleteRecognition(rec2.id), true)
})

test("in-memory fallback works for both flows", async () => {
  __setTestDb(null)
  const s = await fileResolution({ title: "T", description: "" })
  assert.equal((await actOnResolution(s.id, { actorRole: "PARENT", actor: "m", decision: "approve" })).ok, true)
  const r = await fileRecognition({ school: "S", district: "D", type: "upgrade" })
  assert.equal((await actOnRecognition(r.id, { actorRole: "BEO", actor: "b", decision: "approve" })).record?.instance.status, "in_progress")
  assert.ok((await listRecognitions()).some((x) => x.id === r.id))
})
