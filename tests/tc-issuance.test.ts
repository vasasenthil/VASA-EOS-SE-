import { test } from "node:test"
import assert from "node:assert/strict"
import {
  emptyTc,
  validateTc,
  needsCountersign,
  TC_TYPES,
  CLASSES,
  type TcForm,
} from "@/lib/academic/tc"

function valid(): TcForm {
  return {
    studentName: "Kavya R.",
    apaarId: "100200300401",
    udiseCode: "33010100101",
    lastClass: "VIII",
    tcType: "Original — within Tamil Nadu",
    reason: "Family relocating to another district for employment.",
    dateOfLeaving: "2026-06-16",
    duesCleared: true,
    declaration: true,
  }
}

test("an empty TC request fails with field errors", () => {
  const { ok, errors } = validateTc(emptyTc())
  assert.equal(ok, false)
  assert.ok(errors.studentName && errors.apaarId && errors.udiseCode && errors.lastClass && errors.reason && errors.dateOfLeaving && errors.duesCleared && errors.declaration)
})

test("a complete valid request passes", () => {
  assert.equal(validateTc(valid()).ok, true)
})

test("APAAR must be 12 digits and UDISE 11 digits", () => {
  assert.ok(validateTc({ ...valid(), apaarId: "12345" }).errors.apaarId)
  assert.ok(validateTc({ ...valid(), apaarId: "abcd00300401" }).errors.apaarId)
  assert.ok(validateTc({ ...valid(), udiseCode: "330101" }).errors.udiseCode)
  assert.ok(validateTc({ ...valid(), udiseCode: "330101001012" }).errors.udiseCode)
})

test("a TC cannot be issued with pending dues", () => {
  assert.ok(validateTc({ ...valid(), duesCleared: false }).errors.duesCleared)
})

test("the class last studied must be a real class; the date must be well-formed", () => {
  assert.ok(validateTc({ ...valid(), lastClass: "XIII" }).errors.lastClass)
  assert.ok(validateTc({ ...valid(), dateOfLeaving: "16-06-2026" }).errors.dateOfLeaving)
})

test("inter-state and duplicate certificates need a Block counter-signature; within-TN does not", () => {
  assert.equal(needsCountersign({ tcType: "Original — within Tamil Nadu" }), false)
  assert.equal(needsCountersign({ tcType: "Original — inter-state" }), true)
  assert.equal(needsCountersign({ tcType: "Duplicate (lost original)" }), true)
})

test("the certificate-type and class vocabularies are stable", () => {
  assert.equal(TC_TYPES.length, 3)
  assert.deepEqual([...CLASSES], ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"])
})
