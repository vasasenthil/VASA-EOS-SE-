import { test } from "node:test"
import assert from "node:assert/strict"
import { isPass, division, computeResult, buildResults, PASS_MARK } from "@/lib/results"

test("isPass uses the pass mark", () => {
  assert.equal(isPass(PASS_MARK), true)
  assert.equal(isPass(PASS_MARK - 1), false)
})

test("division gates on all-pass then percentage", () => {
  assert.equal(division(90, false), "Fail")
  assert.equal(division(80, true), "Distinction")
  assert.equal(division(65, true), "First")
  assert.equal(division(55, true), "Second")
  assert.equal(division(40, true), "Third")
})

test("computeResult totals, percentages and flags a fail on any subject below pass", () => {
  const pass = computeResult("a", "A", [
    { subject: "Tamil", marks: 80 },
    { subject: "Maths", marks: 70 },
  ])
  assert.equal(pass.total, 150)
  assert.equal(pass.percentage, 75)
  assert.equal(pass.allPass, true)
  assert.equal(pass.division, "Distinction")

  const fail = computeResult("b", "B", [
    { subject: "Tamil", marks: 80 },
    { subject: "Maths", marks: 20 },
  ])
  assert.equal(fail.allPass, false)
  assert.equal(fail.division, "Fail")
})

test("buildResults produces a result per roster student", () => {
  const rows = buildResults()
  assert.ok(rows.length > 0)
  assert.ok(rows.every((r) => r.subjects.length === 5))
})
