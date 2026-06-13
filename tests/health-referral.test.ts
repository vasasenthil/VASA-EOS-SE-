import { test } from "node:test"
import assert from "node:assert/strict"
import {
  emptyReferral,
  validateReferral,
  needsSpecialistReferral,
  triageBand,
  type ReferralForm,
} from "@/lib/health/referral"

const ASOF = new Date("2026-06-10T00:00:00Z")

function valid(): ReferralForm {
  return { studentName: "R. Murugan", className: "IV-B", category: "Diseases", severity: "moderate", screeningDate: "2026-06-05", findings: "Recurrent ear infection observed during screening camp.", guardianPhone: "9876543210", consent: true }
}

test("an empty referral fails with field errors", () => {
  const { ok, errors } = validateReferral(emptyReferral(), ASOF)
  assert.equal(ok, false)
  assert.ok(errors.studentName && errors.className && errors.category && errors.screeningDate && errors.findings && errors.guardianPhone && errors.consent)
})

test("a complete, valid referral passes; future screening date and bad phone rejected", () => {
  assert.equal(validateReferral(valid(), ASOF).ok, true)
  assert.match(validateReferral({ ...valid(), screeningDate: "2030-01-01" }, ASOF).errors.screeningDate ?? "", /future/)
  assert.ok(validateReferral({ ...valid(), guardianPhone: "12" }, ASOF).errors.guardianPhone)
  assert.ok(validateReferral({ ...valid(), consent: false }, ASOF).errors.consent)
})

test("specialist referral triggers on severity OR a referral category", () => {
  assert.equal(needsSpecialistReferral(valid()), false) // moderate Disease -> block-level
  assert.equal(needsSpecialistReferral({ ...valid(), severity: "severe" }), true)
  assert.equal(needsSpecialistReferral({ ...valid(), category: "Developmental delays" }), true)
})

test("triage band reflects urgency", () => {
  assert.equal(triageBand({ ...valid(), severity: "mild", category: "Deficiencies" }), "Routine")
  assert.equal(triageBand(valid()), "Priority") // moderate
  assert.equal(triageBand({ ...valid(), severity: "severe" }), "Urgent")
})
