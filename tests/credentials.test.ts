import { test } from "node:test"
import assert from "node:assert/strict"
import {
  canonicalBody, credentialHash, verifyCredential, verifyDetailed, isRevoked, credentialStatus,
  credentialSummary, queryCredentials, CREDENTIAL_KINDS, type VerifiableCredential,
} from "@/lib/credentials"

const base = {
  id: "vc-test",
  apaarId: "APAAR-TEST",
  kind: "badge" as const,
  title: "Test Badge",
  issuer: "VASA-EOS(SE)",
  issuedAt: "2026-01-01T00:00:00.000Z",
  soulbound: true as const,
  anchorSeq: 1,
}
const credential: VerifiableCredential = { ...base, contentHash: credentialHash(canonicalBody(base)) }

test("an untampered credential verifies", () => {
  assert.equal(verifyCredential(credential).valid, true)
})

test("tampering any field breaks verification", () => {
  const tampered: VerifiableCredential = { ...credential, title: "Forged Title" }
  assert.equal(verifyCredential(tampered).valid, false)
})

test("a missing audit anchor is rejected", () => {
  const unanchored = { ...base, anchorSeq: 0 }
  const c: VerifiableCredential = { ...unanchored, contentHash: credentialHash(canonicalBody(unanchored)) }
  assert.equal(verifyCredential(c).valid, false)
})

test("CREDENTIAL_KINDS lists every kind", () => {
  assert.deepEqual([...CREDENTIAL_KINDS], ["certificate", "badge", "micro-credential", "transcript"])
})

test("revocation is an append-only overlay: still authentic, but not valid", () => {
  const revoked: VerifiableCredential = { ...credential, revoked: true, revokedAt: "2026-02-01T00:00:00.000Z", revokeReason: "issued in error" }
  // canonicalBody / contentHash are unchanged by revocation → authenticity still verifies
  assert.equal(credentialHash(canonicalBody(revoked)), revoked.contentHash)
  assert.equal(verifyCredential(revoked).valid, true) // hash + anchor authenticity unchanged
  assert.equal(isRevoked(revoked), true)
  assert.equal(credentialStatus(revoked), "Revoked")
  assert.equal(credentialStatus(credential), "Issued")
})

test("verifyDetailed separates authenticity from validity and reports the reason", () => {
  const ok = verifyDetailed(credential)
  assert.equal(ok.authentic, true)
  assert.equal(ok.anchored, true)
  assert.equal(ok.revoked, false)
  assert.equal(ok.valid, true)

  const revoked: VerifiableCredential = { ...credential, revoked: true, revokeReason: "duplicate" }
  const rv = verifyDetailed(revoked)
  assert.equal(rv.authentic, true) // mint untampered
  assert.equal(rv.revoked, true)
  assert.equal(rv.valid, false) // revoked → not valid for use
  assert.ok(rv.reasons.some((r) => /Revoked/.test(r)))

  const tampered: VerifiableCredential = { ...credential, title: "Forged" }
  const tv = verifyDetailed(tampered)
  assert.equal(tv.authentic, false)
  assert.equal(tv.valid, false)
  assert.ok(tv.recomputed !== tv.contentHash)
})

test("summary + query: counts, holders, and filters by kind/status/text", () => {
  const all: VerifiableCredential[] = [
    credential,
    { ...credential, id: "vc-2", apaarId: "APAAR-2", kind: "transcript", title: "Marksheet X", revoked: true },
    { ...credential, id: "vc-3", apaarId: "APAAR-2", kind: "certificate", title: "SLC" },
  ]
  const s = credentialSummary(all)
  assert.equal(s.total, 3)
  assert.equal(s.issued, 2)
  assert.equal(s.revoked, 1)
  assert.equal(s.holders, 2) // APAAR-TEST + APAAR-2
  assert.equal(queryCredentials(all, { kind: "certificate" }).length, 1)
  assert.equal(queryCredentials(all, { status: "Revoked" }).length, 1)
  assert.equal(queryCredentials(all, { query: "marksheet" }).length, 1)
})
