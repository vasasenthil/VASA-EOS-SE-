import { test } from "node:test"
import assert from "node:assert/strict"
import { consentGranted, type ConsentRecord } from "@/lib/consent"

function rec(over: Partial<ConsentRecord>): ConsentRecord {
  return { id: "c", subjectApaar: "APAAR-1", purpose: "scheme_eligibility", actor: "guardian", status: "granted", ts: "2026-06-01T00:00:00Z", ...over }
}

test("fail-closed: no record means not granted", () => {
  assert.equal(consentGranted([], "APAAR-1", "scheme_eligibility"), false)
})

test("most recent record wins (grant then withdraw => denied)", () => {
  const records = [
    rec({ status: "granted", ts: "2026-06-01T00:00:00Z" }),
    rec({ status: "withdrawn", ts: "2026-06-05T00:00:00Z" }),
  ]
  assert.equal(consentGranted(records, "APAAR-1", "scheme_eligibility"), false)
})

test("withdraw then re-grant => granted", () => {
  const records = [
    rec({ status: "withdrawn", ts: "2026-06-01T00:00:00Z" }),
    rec({ status: "granted", ts: "2026-06-10T00:00:00Z" }),
  ]
  assert.equal(consentGranted(records, "APAAR-1", "scheme_eligibility"), true)
})

test("consent is scoped to the exact subject and purpose", () => {
  const records = [rec({ status: "granted" })]
  assert.equal(consentGranted(records, "APAAR-2", "scheme_eligibility"), false) // other subject
  assert.equal(consentGranted(records, "APAAR-1", "analytics"), false) // other purpose
  assert.equal(consentGranted(records, "APAAR-1", "scheme_eligibility"), true)
})
