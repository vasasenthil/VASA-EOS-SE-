import { test } from "node:test"
import assert from "node:assert/strict"
import { ageEligible, preprimarySummary, type PrePrimaryChild } from "@/lib/preprimary"

test("ECCE eligibility is ages 3-6 inclusive", () => {
  assert.equal(ageEligible(3), true)
  assert.equal(ageEligible(6), true)
  assert.equal(ageEligible(2), false)
  assert.equal(ageEligible(7), false)
})

test("summary counts total, eligible and girls", () => {
  const kids: PrePrimaryChild[] = [
    { id: "1", name: "A", age: 4, gender: "female", centre: "X" },
    { id: "2", name: "B", age: 7, gender: "male", centre: "X" },
    { id: "3", name: "C", age: 5, gender: "female", centre: "Y" },
  ]
  const s = preprimarySummary(kids)
  assert.equal(s.total, 3)
  assert.equal(s.eligible, 2)
  assert.equal(s.girls, 2)
})
