import { test } from "node:test"
import assert from "node:assert/strict"
import {
  emptyBudget,
  validateBudget,
  needsCabinet,
  CABINET_THRESHOLD,
  PROPOSAL_TYPES,
  BUDGET_HEADS,
  type BudgetForm,
} from "@/lib/finance/budget"

function valid(): BudgetForm {
  return {
    scheme: "Smart classrooms expansion",
    proposalType: "Supplementary",
    budgetHead: "2202-02 — Secondary Education",
    fromHead: "",
    amount: 25000000,
    fiscalYear: "2026-27",
    justification: "Equip 200 secondary schools with smart boards this fiscal year.",
    declaration: true,
  }
}

test("an empty budget proposal fails with field errors", () => {
  const { ok, errors } = validateBudget(emptyBudget())
  assert.equal(ok, false)
  assert.ok(errors.scheme && errors.budgetHead && errors.amount && errors.justification && errors.declaration)
})

test("a complete supplementary proposal passes; non-positive amount rejected", () => {
  assert.equal(validateBudget(valid()).ok, true)
  assert.ok(validateBudget({ ...valid(), amount: 0 }).errors.amount)
  assert.ok(validateBudget({ ...valid(), justification: "too short" }).errors.justification)
})

test("a re-appropriation needs a distinct source head", () => {
  const reappr: BudgetForm = { ...valid(), proposalType: "Re-appropriation" }
  // No source head selected → error.
  assert.ok(validateBudget(reappr).errors.fromHead)
  // Source head equal to target head → error.
  assert.ok(validateBudget({ ...reappr, fromHead: reappr.budgetHead }).errors.fromHead)
  // A distinct, valid source head passes.
  assert.equal(validateBudget({ ...reappr, fromHead: "2202-01 — Elementary Education" }).ok, true)
})

test("an invalid fiscal year is rejected", () => {
  assert.ok(validateBudget({ ...valid(), fiscalYear: "2026" }).errors.fiscalYear)
  assert.equal(validateBudget({ ...valid(), fiscalYear: "2027-28" }).ok, true)
})

test("fresh sanctions always route to Cabinet; supplementary/re-appropriation only above threshold", () => {
  // A fresh sanction is always Cabinet-bound, even for a small amount.
  assert.equal(needsCabinet({ ...valid(), proposalType: "Fresh sanction", amount: 1 }), true)
  // A supplementary below the threshold stays at Secretariat level.
  assert.equal(needsCabinet({ ...valid(), amount: CABINET_THRESHOLD - 1 }), false)
  // At/above the threshold it is Cabinet-bound regardless of type.
  assert.equal(needsCabinet({ ...valid(), amount: CABINET_THRESHOLD }), true)
  assert.equal(needsCabinet({ ...valid(), proposalType: "Re-appropriation", fromHead: "2202-01 — Elementary Education", amount: CABINET_THRESHOLD + 1 }), true)
})

test("the proposal-type and budget-head vocabularies are stable", () => {
  assert.deepEqual([...PROPOSAL_TYPES], ["Fresh sanction", "Re-appropriation", "Supplementary"])
  assert.ok(BUDGET_HEADS.length >= 4)
  assert.ok(BUDGET_HEADS.every((h) => /^\d{4}/.test(h)))
})
