import { test } from "node:test"
import assert from "node:assert/strict"
import {
  emptyTransfer,
  validateTransfer,
  isInterDistrict,
  transferEligibility,
  MIN_SERVICE_YEARS,
  type TransferForm,
} from "@/lib/staff/transfer"

function valid(): TransferForm {
  return { teacherName: "S. Anbu", currentSchool: "GHSS Egmore", currentDistrict: "Chennai", requestedDistrict: "Coimbatore", requestedSchool: "GHSS Coimbatore", reason: "Request (general)", yearsOfService: 8, declaration: true }
}

test("an empty request fails with field errors", () => {
  const { ok, errors } = validateTransfer(emptyTransfer())
  assert.equal(ok, false)
  assert.ok(errors.teacherName && errors.currentSchool && errors.currentDistrict && errors.requestedDistrict && errors.reason && errors.declaration)
})

test("a complete valid request passes; same-place request rejected", () => {
  assert.equal(validateTransfer(valid()).ok, true)
  const same = { ...valid(), requestedDistrict: "Chennai", requestedSchool: "GHSS Egmore" }
  assert.ok(validateTransfer(same).errors.requestedSchool)
})

test("inter-district is detected from a district change", () => {
  assert.equal(isInterDistrict(valid()), true)
  assert.equal(isInterDistrict({ ...valid(), requestedDistrict: "Chennai" }), false)
})

test("eligibility: priority grounds waive minimum service; general needs the threshold", () => {
  assert.equal(transferEligibility({ ...valid(), reason: "Medical", yearsOfService: 1 }).eligible, true)
  assert.equal(transferEligibility({ ...valid(), reason: "Request (general)", yearsOfService: MIN_SERVICE_YEARS }).eligible, true)
  assert.equal(transferEligibility({ ...valid(), reason: "Request (general)", yearsOfService: MIN_SERVICE_YEARS - 1 }).eligible, false)
})
