import { test } from "node:test"
import assert from "node:assert/strict"
import { ELIGIBILITY_CRITERIA } from "@/lib/recognition"
import {
  emptyApplication,
  validateApplication,
  completenessPct,
  MANAGEMENT_OPTIONS,
  type RecognitionApplicationForm,
} from "@/lib/recognition/application"

function validNew(): RecognitionApplicationForm {
  return {
    school: "GHSS Egmore", district: "Chennai", block: "Chennai North", type: "new",
    management: "Private Unaided", trustRegNo: "TR/2026/0091", udiseCode: "",
    landStatus: "Owned", contactEmail: "head@school.tn.gov.in", contactPhone: "9840012345",
    criteriaMet: [...ELIGIBILITY_CRITERIA].slice(0, 5), declaration: true,
  }
}

test("an empty application fails with multiple field errors", () => {
  const { ok, errors } = validateApplication(emptyApplication())
  assert.equal(ok, false)
  assert.ok(errors.school && errors.district && errors.block && errors.contactEmail && errors.declaration)
})

test("a complete, valid new application passes", () => {
  const { ok, errors } = validateApplication(validNew())
  assert.equal(ok, true, JSON.stringify(errors))
})

test("a new school must give a trust reg number; a renewal must give a valid UDISE", () => {
  const noTrust = { ...validNew(), trustRegNo: "" }
  assert.equal(validateApplication(noTrust).errors.trustRegNo, "Trust/Society registration number is required for a new school")
  const renewalBadUdise = { ...validNew(), type: "renewal" as const, trustRegNo: "", udiseCode: "123" }
  assert.match(validateApplication(renewalBadUdise).errors.udiseCode ?? "", /11-digit UDISE/)
  const renewalOk = { ...validNew(), type: "renewal" as const, trustRegNo: "", udiseCode: "33010100101" }
  assert.equal(validateApplication(renewalOk).ok, true)
})

test("email, phone and criteria-minimum are enforced", () => {
  assert.match(validateApplication({ ...validNew(), contactEmail: "not-an-email" }).errors.contactEmail ?? "", /valid email/)
  assert.match(validateApplication({ ...validNew(), contactPhone: "12345" }).errors.contactPhone ?? "", /10-digit/)
  assert.match(validateApplication({ ...validNew(), criteriaMet: ["Trust/Society registration"] }).errors.criteriaMet ?? "", /At least 4/)
  assert.match(validateApplication({ ...validNew(), criteriaMet: [...ELIGIBILITY_CRITERIA, "Bogus"] }).errors.criteriaMet ?? "", /Unknown/)
})

test("an invalid management type is rejected; valid ones accepted", () => {
  assert.ok(validateApplication({ ...validNew(), management: "Pirate" }).errors.management)
  for (const m of MANAGEMENT_OPTIONS) assert.ok(validateApplication({ ...validNew(), management: m }).ok)
})

test("completeness rises from 0 toward 100 as the form is filled", () => {
  assert.ok(completenessPct(emptyApplication()) < 20)
  assert.equal(completenessPct(validNew()), 100)
})
