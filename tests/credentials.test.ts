import { test } from "node:test"
import assert from "node:assert/strict"
import { canonicalBody, credentialHash, verifyCredential, type VerifiableCredential } from "@/lib/credentials"

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
