import { test } from "node:test"
import assert from "node:assert/strict"
import {
  emptyResolution,
  validateResolution,
  quorumMet,
  completenessPct,
  SMC_QUORUM,
  type SmcResolutionForm,
} from "@/lib/smc/resolution"

const ASOF = new Date("2026-06-10T00:00:00Z")

function valid(): SmcResolutionForm {
  return {
    title: "Approve mid-day-meal kitchen repair", category: "Infrastructure works", meetingDate: "2026-06-05",
    description: "Resolved to repair the kitchen roof before the monsoon using the SMC maintenance grant.",
    proposedBy: "K. Selvi", secondedBy: "R. Murugan", membersPresent: 5, fundImplication: 45000, declaration: true,
  }
}

test("an empty resolution fails with field errors", () => {
  const { ok, errors } = validateResolution(emptyResolution(), ASOF)
  assert.equal(ok, false)
  assert.ok(errors.title && errors.category && errors.meetingDate && errors.description && errors.proposedBy && errors.membersPresent && errors.declaration)
})

test("a complete, valid resolution passes", () => {
  const { ok, errors } = validateResolution(valid(), ASOF)
  assert.equal(ok, true, JSON.stringify(errors))
})

test("the seconder must differ from the proposer", () => {
  assert.match(validateResolution({ ...valid(), secondedBy: "K. Selvi" }, ASOF).errors.secondedBy ?? "", /different member/)
})

test("a quorum is enforced", () => {
  assert.match(validateResolution({ ...valid(), membersPresent: 2 }, ASOF).errors.membersPresent ?? "", new RegExp(`at least ${SMC_QUORUM}`))
  assert.equal(quorumMet({ ...valid(), membersPresent: SMC_QUORUM }), true)
  assert.equal(quorumMet({ ...valid(), membersPresent: 1 }), false)
})

test("meeting date cannot be in the future and must be valid", () => {
  assert.match(validateResolution({ ...valid(), meetingDate: "2030-01-01" }, ASOF).errors.meetingDate ?? "", /future/)
  assert.match(validateResolution({ ...valid(), meetingDate: "bad" }, ASOF).errors.meetingDate ?? "", /valid date/)
})

test("a short resolution text and negative fund implication are rejected", () => {
  assert.ok(validateResolution({ ...valid(), description: "too short" }, ASOF).errors.description)
  assert.ok(validateResolution({ ...valid(), fundImplication: -10 }, ASOF).errors.fundImplication)
})

test("completeness rises from low to 100", () => {
  assert.ok(completenessPct(emptyResolution()) < 20)
  assert.equal(completenessPct(valid()), 100)
})
