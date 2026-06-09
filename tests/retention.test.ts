import { test } from "node:test"
import assert from "node:assert/strict"
import {
  RETENTION_RULES,
  RTE_LIFECYCLE,
  ruleFor,
  unknownClasses,
  uncoveredClasses,
  retentionSummary,
  toCSV,
} from "@/lib/consent/retention"
import { PII_CATALOGUE } from "@/lib/consent/pii-catalogue"

test("retention schedule maps 1:1 to the PII catalogue (self-verifying both ways)", () => {
  assert.deepEqual(unknownClasses(), []) // no rule points at a non-existent class
  assert.deepEqual(uncoveredClasses(), []) // no PII class is left without a rule
  assert.equal(RETENTION_RULES.length, PII_CATALOGUE.length)
})

test("rules are well-formed: valid action, ≥1 trigger, a statutory-hold field", () => {
  for (const r of RETENTION_RULES) {
    assert.ok(["hard-delete", "anonymise", "archive"].includes(r.erasureAction))
    assert.ok(r.triggers.length >= 1)
    assert.ok(r.statutoryHold)
    assert.ok(r.retentionDays === null || r.retentionDays >= 0)
  }
})

test("Aadhaar is never stored (0-day hard delete); scheme data holds for the audit window", () => {
  const aadhaar = ruleFor("aadhaar")
  assert.equal(aadhaar?.retentionDays, 0)
  assert.equal(aadhaar?.erasureAction, "hard-delete")
  assert.equal(ruleFor("scheme")?.retentionDays, 2555) // 7-year financial audit window
})

test("right-to-erasure is honoured and ends in an audited confirmation", () => {
  assert.ok(retentionSummary().honoursRte >= 1)
  const stages = RTE_LIFECYCLE.map((s) => s.stage)
  assert.deepEqual(stages, ["received", "identity-verified", "assessed", "executed", "confirmed"])
})

test("summary tallies erasure actions", () => {
  const s = retentionSummary()
  assert.equal(s.rules, RETENTION_RULES.length)
  assert.equal(s.hardDelete + s.anonymise + s.archive, s.rules)
})

test("CSV has a header plus one row per rule", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Data class,Retention,Erasure action,Triggers,Statutory hold")
  assert.equal(lines.length, RETENTION_RULES.length + 1)
})
