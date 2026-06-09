import { test } from "node:test"
import assert from "node:assert/strict"
import { validateApplicant, makeApaarId } from "@/lib/admissions"

const base = { name: "New Kid", dob: "2018-05-01", gender: "female", category: "BC", className: "Class 1" }

test("validateApplicant requires name, dob and class", () => {
  assert.equal(validateApplicant(base), null)
  assert.match(validateApplicant({ ...base, name: " " }) ?? "", /name/i)
  assert.match(validateApplicant({ ...base, dob: "" }) ?? "", /birth/i)
  assert.match(validateApplicant({ ...base, className: "" }) ?? "", /class/i)
})

test("makeApaarId mints a 12-digit APAAR id deterministically", () => {
  assert.equal(makeApaarId(1), "APAAR-100000000001")
  assert.equal(makeApaarId(42), "APAAR-100000000042")
  assert.match(makeApaarId(7), /^APAAR-\d{12}$/)
})
