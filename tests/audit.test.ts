import { test } from "node:test"
import assert from "node:assert/strict"
import { appendAudit, getTrail, verifyTrail } from "@/lib/audit/trail"

// No service-role key is configured under test, so the audit ledger uses its
// in-memory fallback. The chain semantics (linkage, monotonic seq, verification)
// are identical to the persisted path.

test("each entry links to the previous via its hash", async () => {
  const a = await appendAudit({ actor: "t", action: "create", resource: "r1" })
  const b = await appendAudit({ actor: "t", action: "update", resource: "r2" })
  assert.equal(b.prevHash, a.hash)
  assert.equal(b.seq, a.seq + 1)
})

test("the chain verifies after appends", async () => {
  await appendAudit({ actor: "t", action: "x", resource: "r3", details: { k: "v" } })
  assert.equal(await verifyTrail(), true)
})

test("getTrail returns appended entries in order", async () => {
  const before = (await getTrail()).length
  await appendAudit({ actor: "t", action: "y", resource: "r4" })
  const trail = await getTrail()
  assert.equal(trail.length, before + 1)
  for (let i = 1; i < trail.length; i++) {
    assert.equal(trail[i].seq, trail[i - 1].seq + 1)
  }
})

test("details are preserved on the entry", async () => {
  const e = await appendAudit({ actor: "auditor", action: "review", resource: "r5", details: { score: 42 } })
  assert.equal(e.details?.score, 42)
  assert.ok(e.hash.length > 0)
})
