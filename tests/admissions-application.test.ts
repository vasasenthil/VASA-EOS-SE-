import { test } from "node:test"
import assert from "node:assert/strict"
import {
  emptyAdmission,
  validateAdmission,
  completenessPct,
  ageYears,
  type AdmissionApplicationForm,
} from "@/lib/admissions/application"

const ASOF = new Date("2026-06-10T00:00:00Z")

function valid(): AdmissionApplicationForm {
  return {
    studentName: "Arun Kumar", dob: "2018-05-10", gender: "Male", socialCategory: "SC", className: "Class 3",
    guardianName: "K. Murugan", guardianPhone: "9840012345", guardianEmail: "", address: "12 North Street, Egmore, Chennai 600008",
    previousSchool: "", rteQuota: false, documents: ["Birth certificate", "Address proof", "Photograph"], declaration: true,
  }
}

test("age is computed in whole years on the reference date", () => {
  assert.equal(ageYears("2018-05-10", ASOF), 8)
  assert.equal(ageYears("2018-07-10", ASOF), 7) // birthday not yet reached in June
})

test("an empty application fails with many field errors", () => {
  const { ok, errors } = validateAdmission(emptyAdmission(), ASOF)
  assert.equal(ok, false)
  assert.ok(errors.studentName && errors.dob && errors.gender && errors.documents && errors.declaration)
})

test("a complete, valid application passes", () => {
  const { ok, errors } = validateAdmission(valid(), ASOF)
  assert.equal(ok, true, JSON.stringify(errors))
})

test("date of birth must be valid, not future, and age-appropriate (RTE §4)", () => {
  assert.match(validateAdmission({ ...valid(), dob: "2030-01-01" }, ASOF).errors.dob ?? "", /future/)
  assert.match(validateAdmission({ ...valid(), dob: "1990-01-01" }, ASOF).errors.dob ?? "", /appropriate/) // age 36
  assert.match(validateAdmission({ ...valid(), dob: "not-a-date" }, ASOF).errors.dob ?? "", /valid date/)
})

test("core documents are required; the RTE claim demands an income certificate", () => {
  assert.match(validateAdmission({ ...valid(), documents: ["Photograph"] }, ASOF).errors.documents ?? "", /core documents/)
  const rteNoIncome = { ...valid(), rteQuota: true }
  assert.match(validateAdmission(rteNoIncome, ASOF).errors.documents ?? "", /income certificate/i)
  const rteOk = { ...valid(), rteQuota: true, documents: ["Birth certificate", "Address proof", "Photograph", "Income certificate (RTE)"] }
  assert.equal(validateAdmission(rteOk, ASOF).ok, true)
})

test("phone and optional email are validated", () => {
  assert.match(validateAdmission({ ...valid(), guardianPhone: "123" }, ASOF).errors.guardianPhone ?? "", /10-digit/)
  assert.ok(validateAdmission({ ...valid(), guardianEmail: "bad" }, ASOF).errors.guardianEmail)
  assert.equal(validateAdmission({ ...valid(), guardianEmail: "g@x.in" }, ASOF).ok, true)
})

test("completeness rises from low to 100", () => {
  assert.ok(completenessPct(emptyAdmission()) < 20)
  assert.equal(completenessPct(valid()), 100)
})
