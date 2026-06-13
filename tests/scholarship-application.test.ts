import { test } from "node:test"
import assert from "node:assert/strict"
import {
  emptyScholarship,
  validateScholarship,
  deriveEligibility,
  maskAccount,
  INCOME_CEILING,
  MIN_ATTENDANCE,
  type ScholarshipForm,
} from "@/lib/scholarship/application"

function valid(): ScholarshipForm {
  return { studentName: "K. Selvi", scheme: "BC/MBC Scholarship", category: "BC", annualIncome: 120000, attendancePct: 92, bankAccount: "123456789012", amount: 12000, declaration: true }
}

test("an empty application fails with field errors", () => {
  const { ok, errors } = validateScholarship(emptyScholarship())
  assert.equal(ok, false)
  assert.ok(errors.studentName && errors.scheme && errors.category && errors.bankAccount && errors.amount && errors.declaration)
})

test("a complete, valid application passes; bad bank account rejected", () => {
  assert.equal(validateScholarship(valid()).ok, true)
  assert.ok(validateScholarship({ ...valid(), bankAccount: "12" }).errors.bankAccount)
  assert.ok(validateScholarship({ ...valid(), attendancePct: 150 }).errors.attendancePct)
})

test("eligibility is derived by the reasoning engine: reserved category waives income", () => {
  // Reserved category + good attendance -> eligible even above the income ceiling.
  const e1 = deriveEligibility({ ...valid(), category: "SC", annualIncome: INCOME_CEILING + 500000 })
  assert.equal(e1.eligible, true)
  // General category above the income ceiling -> not eligible.
  const e2 = deriveEligibility({ ...valid(), category: "General", annualIncome: INCOME_CEILING + 1 })
  assert.equal(e2.eligible, false)
})

test("attendance below the norm blocks eligibility and is explained", () => {
  const e = deriveEligibility({ ...valid(), attendancePct: MIN_ATTENDANCE - 1 })
  assert.equal(e.eligible, false)
  assert.ok(e.reasons.some((r) => /Attendance below/.test(r)))
})

test("the DBT account is masked to the last four digits", () => {
  assert.equal(maskAccount("123456789012"), "••••9012")
  assert.equal(maskAccount("12"), "12")
})
