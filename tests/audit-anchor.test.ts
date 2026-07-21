import { test } from "node:test"
import assert from "node:assert/strict"
import { appendAudit, buildAuditAnchorProof, createAuditAnchorProof, getTrail, type AuditEntry } from "@/lib/audit/trail"

test("audit anchor proof summarizes the hash chain for permissioned-ledger anchoring", async () => {
  const before = (await getTrail()).length
  await appendAudit({ actor: "external-auditor", action: "anchor.test", resource: "audit-ledger" })
  const proof = await createAuditAnchorProof("2026-07-21T00:00:00.000Z")

  assert.equal(proof.ledger, "permissioned-ledger-anchor")
  assert.equal(proof.verificationStatus, "verified")
  assert.ok(proof.entryCount >= before + 1)
  assert.ok(proof.toSeq >= proof.fromSeq)
  assert.match(proof.rootHash, /^[0-9a-f]{8}$/)
  assert.match(proof.anchorHash, /^[0-9a-f]{8}$/)
})

test("audit anchor proof is deterministic for the same chain and timestamp", async () => {
  const entries = await getTrail()
  const a = buildAuditAnchorProof(entries, "2026-07-21T00:00:00.000Z")
  const b = buildAuditAnchorProof(entries, "2026-07-21T00:00:00.000Z")

  assert.deepEqual(a, b)
})

test("audit anchor proof detects a broken hash chain", async () => {
  const [entry] = await getTrail()
  assert.ok(entry)
  const tampered: AuditEntry = { ...entry, resource: "tampered-resource" }
  const proof = buildAuditAnchorProof([tampered], "2026-07-21T00:00:00.000Z")

  assert.equal(proof.verificationStatus, "broken-chain")
})
