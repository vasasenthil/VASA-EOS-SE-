import { test } from "node:test"
import assert from "node:assert/strict"
import { PII_CATALOGUE, piiClassById, gatingPurpose, byPurpose, piiSummary, toCSV } from "@/lib/consent/pii-catalogue"
import { CONSENT_PURPOSES } from "@/lib/consent"

const VALID_PURPOSES = new Set(CONSENT_PURPOSES.map((p) => p.key))

test("every PII class is well-formed and gated by a valid consent purpose", () => {
  assert.ok(PII_CATALOGUE.length >= 6)
  const ids = new Set<string>()
  for (const p of PII_CATALOGUE) {
    assert.ok(!ids.has(p.id), `duplicate id ${p.id}`)
    ids.add(p.id)
    assert.ok(VALID_PURPOSES.has(p.purpose), `${p.id} → unknown purpose ${p.purpose}`)
    assert.ok(["normal", "sensitive", "child"].includes(p.sensitivity))
    assert.ok(["consent", "guardian-consent", "legitimate-use"].includes(p.basis))
  }
})

test("gatingPurpose resolves the purpose a getter must enforce", () => {
  assert.equal(gatingPurpose("disability"), "health_federation")
  assert.equal(gatingPurpose("scheme"), "scheme_eligibility")
  assert.equal(gatingPurpose("identity"), "aadhaar_linkage")
  assert.equal(gatingPurpose("nope"), undefined)
})

test("byPurpose groups classes; lookups resolve", () => {
  assert.ok(byPurpose("health_federation").some((p) => p.id === "disability"))
  assert.equal(piiClassById("aadhaar")?.retention, "Never stored (auth-only)")
})

test("summary counts sensitivity bands and consent-gated classes", () => {
  const s = piiSummary()
  assert.equal(s.classes, PII_CATALOGUE.length)
  assert.ok(s.sensitive >= 3)
  assert.ok(s.child >= 1)
  assert.equal(s.consentGated, PII_CATALOGUE.filter((p) => p.basis !== "legitimate-use").length)
})

test("CSV has a header plus one row per data class", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Data class,Examples,Sensitivity,Gating purpose,Lawful basis,Retention,Stored in")
  assert.equal(lines.length, PII_CATALOGUE.length + 1)
})
