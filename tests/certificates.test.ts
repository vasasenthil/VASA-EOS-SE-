import { test } from "node:test"
import assert from "node:assert/strict"
import { CERT_TYPES, certRef, certTypeDef } from "@/lib/certificates"

test("there are three certificate types with distinct prefixes", () => {
  assert.equal(CERT_TYPES.length, 3)
  assert.equal(new Set(CERT_TYPES.map((c) => c.prefix)).size, 3)
})

test("certRef formats PREFIX/YEAR/zero-padded-seq", () => {
  assert.equal(certRef("transfer", 123), "TC/2026/000123")
  assert.equal(certRef("bonafide", 1, 2027), "BC/2027/000001")
  assert.equal(certRef("conduct", 9), "CC/2026/000009")
})

test("certTypeDef resolves a known type", () => {
  assert.equal(certTypeDef("bonafide").prefix, "BC")
})
