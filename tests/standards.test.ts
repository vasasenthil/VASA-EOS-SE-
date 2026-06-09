import { test } from "node:test"
import assert from "node:assert/strict"
import {
  ID_STANDARDS,
  standardById,
  validate,
  invalidExamples,
  standardsSummary,
  toCSV,
} from "@/lib/data/standards"

test("every standard's example validates against its own pattern (self-verifying)", () => {
  assert.deepEqual(invalidExamples(), [])
})

test("register is well-formed: unique ids, anchored patterns, fields present", () => {
  const ids = new Set<string>()
  for (const s of ID_STANDARDS) {
    assert.ok(!ids.has(s.id), `duplicate ${s.id}`)
    ids.add(s.id)
    assert.ok(s.pattern.startsWith("^") && s.pattern.endsWith("$"), `${s.id} pattern must be anchored`)
    assert.ok(s.name && s.authority && s.usedFor)
  }
})

test("validate() accepts well-formed ids and rejects malformed / unknown", () => {
  assert.equal(validate("apaar", "100200300401"), true)
  assert.equal(validate("apaar", "12345"), false) // too short
  assert.equal(validate("udise", "33010100101"), true)
  assert.equal(validate("ifsc", "SBIN0001234"), true)
  assert.equal(validate("ifsc", "sbin0001234"), false) // lower-case
  assert.equal(validate("mobile", "1234509876"), false) // must start 6-9
  assert.equal(validate("not-a-standard", "x"), false) // unknown standard
})

test("lookups resolve; Aadhaar is verify-only and class code covers 1-12", () => {
  assert.match(standardById("aadhaar")?.usedFor ?? "", /never stored/i)
  assert.equal(validate("class-code", "09"), true)
  assert.equal(validate("class-code", "13"), false)
  assert.equal(validate("class-code", "00"), false)
})

test("summary tallies standards and distinct authorities", () => {
  const s = standardsSummary()
  assert.equal(s.standards, ID_STANDARDS.length)
  assert.ok(s.authorities > 1 && s.authorities <= ID_STANDARDS.length)
})

test("CSV has a header plus one row per standard", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Standard,Authority,Pattern,Example,Used for")
  assert.equal(lines.length, ID_STANDARDS.length + 1)
})
