import { test } from "node:test"
import assert from "node:assert/strict"
import {
  emptyRti,
  validateRti,
  applicationFee,
  responseTiming,
  RTI_FEE,
  type RtiForm,
} from "@/lib/rti/request"

function valid(): RtiForm {
  return { applicant: "P. Kumar", category: "Schemes / DBT", subject: "RTE reimbursement status", informationSought: "Status of the 2025-26 RTE reimbursement claim for the school.", bpl: false, lifeAndLiberty: false, declaration: true }
}

test("an empty RTI fails with field errors", () => {
  const { ok, errors } = validateRti(emptyRti())
  assert.equal(ok, false)
  assert.ok(errors.applicant && errors.category && errors.subject && errors.informationSought && errors.declaration)
})

test("a complete valid RTI passes; short information rejected", () => {
  assert.equal(validateRti(valid()).ok, true)
  assert.ok(validateRti({ ...valid(), informationSought: "too short" }).errors.informationSought)
})

test("BPL applicants are fee-exempt; others pay the standard fee", () => {
  assert.equal(applicationFee(valid()), RTI_FEE)
  assert.equal(applicationFee({ ...valid(), bpl: true }), 0)
})

test("life-and-liberty requests are expedited to 48 hours", () => {
  assert.equal(responseTiming(valid()).expedited, false)
  assert.match(responseTiming(valid()).deadline, /30 days/)
  const ll = responseTiming({ ...valid(), lifeAndLiberty: true })
  assert.equal(ll.expedited, true)
  assert.match(ll.deadline, /48 hours/)
})
