import { test } from "node:test"
import assert from "node:assert/strict"
import {
  emptyLeave,
  validateLeave,
  durationDays,
  completenessPct,
  type LeaveApplicationForm,
} from "@/lib/leave/application"

function valid(): LeaveApplicationForm {
  return {
    teacher: "S. Latha", type: "casual", from: "2026-07-01", to: "2026-07-03",
    reason: "Family function out of station", substitute: "Covered by P. Kumar", contact: "",
    medicalCert: false, declaration: true,
  }
}

test("duration is the inclusive day count of a valid range, else 0", () => {
  assert.equal(durationDays(valid()), 3) // 1–3 July inclusive
  assert.equal(durationDays({ ...valid(), to: "2026-06-30" }), 0) // end before start
  assert.equal(durationDays({ ...valid(), from: "" }), 0)
})

test("an empty application fails with field errors", () => {
  const { ok, errors } = validateLeave(emptyLeave())
  assert.equal(ok, false)
  assert.ok(errors.teacher && errors.type && errors.from && errors.to && errors.reason && errors.declaration)
})

test("a complete, valid application passes", () => {
  const { ok, errors } = validateLeave(valid())
  assert.equal(ok, true, JSON.stringify(errors))
})

test("end date cannot precede the start date", () => {
  assert.match(validateLeave({ ...valid(), to: "2026-06-30" }).errors.to ?? "", /before the start/)
})

test("medical leave beyond 2 days needs a certificate", () => {
  const longMedical = { ...valid(), type: "medical" as const, from: "2026-07-01", to: "2026-07-05" } // 5 days
  assert.match(validateLeave(longMedical).errors.medicalCert ?? "", /medical certificate/)
  assert.equal(validateLeave({ ...longMedical, medicalCert: true }).ok, true)
  // ≤2 days medical does not require a certificate
  const shortMedical = { ...valid(), type: "medical" as const, from: "2026-07-01", to: "2026-07-02" }
  assert.equal(validateLeave(shortMedical).ok, true)
})

test("an optional contact number, if given, must be 10 digits", () => {
  assert.ok(validateLeave({ ...valid(), contact: "123" }).errors.contact)
  assert.equal(validateLeave({ ...valid(), contact: "9840012345" }).ok, true)
})

test("completeness rises from low to 100", () => {
  assert.ok(completenessPct(emptyLeave()) < 30)
  assert.equal(completenessPct(valid()), 100)
})
