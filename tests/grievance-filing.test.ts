import { test } from "node:test"
import assert from "node:assert/strict"
import {
  emptyGrievance,
  validateGrievance,
  completenessPct,
  MIN_DESCRIPTION,
  GRIEVANCE_CATEGORIES,
  type GrievanceFilingForm,
} from "@/lib/grievance/filing"

function valid(): GrievanceFilingForm {
  return {
    applicantName: "R. Murugan", relationship: "Parent / Guardian", contactPhone: "9840012345", contactEmail: "",
    category: "Fees", school: "GHSS Egmore", district: "Chennai", subject: "Unauthorised fee collection",
    description: "The school collected a development fee not approved by the fee committee for class 9.", urgency: "High", consent: true,
  }
}

test("an empty grievance fails with multiple field errors", () => {
  const { ok, errors } = validateGrievance(emptyGrievance())
  assert.equal(ok, false)
  assert.ok(errors.applicantName && errors.relationship && errors.contactPhone && errors.category && errors.description && errors.consent)
})

test("a complete, valid grievance passes", () => {
  const { ok, errors } = validateGrievance(valid())
  assert.equal(ok, true, JSON.stringify(errors))
})

test("phone, email, category and a substantive description are enforced", () => {
  assert.match(validateGrievance({ ...valid(), contactPhone: "12345" }).errors.contactPhone ?? "", /10-digit/)
  assert.match(validateGrievance({ ...valid(), contactEmail: "nope" }).errors.contactEmail ?? "", /valid email/)
  assert.equal(validateGrievance({ ...valid(), contactEmail: "" }).ok, true) // email optional
  assert.ok(validateGrievance({ ...valid(), category: "Made up" }).errors.category)
  assert.match(validateGrievance({ ...valid(), description: "too short" }).errors.description ?? "", new RegExp(`${MIN_DESCRIPTION} characters`))
})

test("consent is mandatory (DPDP)", () => {
  assert.ok(validateGrievance({ ...valid(), consent: false }).errors.consent)
})

test("every listed category is accepted", () => {
  for (const c of GRIEVANCE_CATEGORIES) assert.equal(validateGrievance({ ...valid(), category: c }).ok, true)
})

test("completeness rises from low to 100", () => {
  assert.ok(completenessPct(emptyGrievance()) < 20)
  assert.equal(completenessPct(valid()), 100)
})
