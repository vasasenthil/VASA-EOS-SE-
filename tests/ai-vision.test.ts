import { test } from "node:test"
import assert from "node:assert/strict"
import { extractFields, scoreOmr, TC_FIELD_SPEC } from "@/lib/ai/vision"

const TC_TEXT = [
  "TRANSFER CERTIFICATE",
  "Name: K. Selvi",
  "Date of Birth - 12/05/2014",
  "UDISE Code: 33010100101",
  "Standard: VI",
  "School: GHSS Egmore",
].join("\n")

test("extractFields pulls labelled key/values from OCR'd document text", () => {
  const r = extractFields(TC_TEXT, TC_FIELD_SPEC)
  const byKey = Object.fromEntries(r.fields.map((f) => [f.key, f.value]))
  assert.equal(byKey.name, "K. Selvi")
  assert.equal(byKey.dob, "12/05/2014") // handles "- " separator
  assert.equal(byKey.udise, "33010100101")
  assert.equal(byKey.class, "VI")
  assert.ok(r.coverage >= 0.8)
  assert.equal(r.humanAuthority, true)
})

test("a missing field is reported with zero confidence, not invented", () => {
  const r = extractFields("Name: A. Kumar", TC_FIELD_SPEC)
  const adm = r.fields.find((f) => f.key === "admissionNo")!
  assert.equal(adm.value, "")
  assert.equal(adm.confidence, 0)
  assert.equal(adm.sourceLine, -1)
})

test("OMR scoring is composed into the vision capability", () => {
  const s = scoreOmr({ 1: "A", 2: "C", 3: "B", 4: "D", 5: "A", 6: "B", 7: "C", 8: "A" })
  assert.equal(s.correct, s.total) // all match the seeded ANSWER_KEY
  assert.equal(s.pct, 100)
})
