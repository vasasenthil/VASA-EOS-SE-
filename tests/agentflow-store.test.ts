import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { __setTestDb } from "@/lib/persistence"
import { queueToolRequest, decideToolRequest, listToolRequests } from "@/lib/agentflow/store"

beforeEach(() => __setTestDb(null)) // in-memory seeded path
afterEach(() => __setTestDb(undefined))

test("queue creates a pending request; the inbox is seeded", async () => {
  const r = await queueToolRequest("welfare", "initiate_dbt", { apaar: "APAAR-9", amount: 6000 })
  assert.equal(r.status, "pending")
  const all = await listToolRequests()
  assert.ok(all.length >= 3) // 2 seeds + the new one
  assert.ok(all.some((x) => x.id === r.id))
})

test("approving runs the tool against its real seam and records output", async () => {
  const r = await queueToolRequest("welfare", "initiate_dbt", { apaar: "APAAR-9", amount: 6000 })
  const res = await decideToolRequest(r.id, true, "officer")
  assert.equal(res.ok, true)
  assert.equal(res.request?.status, "approved")
  assert.match(res.request?.output ?? "", /DBT settled — APBS/)
})

test("rejecting marks the request rejected (no execution)", async () => {
  const r = await queueToolRequest("compliance", "flag_violation", { kind: "x", ref: "y" })
  const res = await decideToolRequest(r.id, false, "officer")
  assert.equal(res.request?.status, "rejected")
  assert.equal(res.request?.output, undefined)
})

test("a request cannot be decided twice", async () => {
  const r = await queueToolRequest("welfare", "initiate_dbt", { apaar: "A", amount: 100 })
  await decideToolRequest(r.id, true, "officer")
  const again = await decideToolRequest(r.id, false, "officer")
  assert.equal(again.ok, false)
  assert.match(again.reason ?? "", /Already decided/)
})

test("invalid tool args block approval", async () => {
  const r = await queueToolRequest("welfare", "initiate_dbt", { apaar: "A" }) // missing amount
  const res = await decideToolRequest(r.id, true, "officer")
  assert.equal(res.ok, false)
  assert.match(res.reason ?? "", /amount/)
})
