import { test } from "node:test"
import assert from "node:assert/strict"
import { HALLS, seatingPlan } from "@/lib/exam-seating"

const TOTAL = HALLS.reduce((s, h) => s + h.capacity, 0)

test("seats everyone within capacity, no overflow", () => {
  const plan = seatingPlan(120)
  assert.equal(plan.seated, 120)
  assert.equal(plan.unseated, 0)
  assert.equal(plan.allocations.reduce((s, a) => s + a.seats, 0), 120)
})

test("fills halls greedily in order", () => {
  const plan = seatingPlan(70) // 60 in Hall A, 10 in Hall B
  assert.equal(plan.allocations[0].seats, HALLS[0].capacity)
  assert.equal(plan.allocations[1].seats, 70 - HALLS[0].capacity)
})

test("reports overflow beyond total capacity", () => {
  const plan = seatingPlan(TOTAL + 25)
  assert.equal(plan.seated, TOTAL)
  assert.equal(plan.unseated, 25)
})

test("zero candidates seats nobody", () => {
  const plan = seatingPlan(0)
  assert.equal(plan.seated, 0)
  assert.equal(plan.unseated, 0)
})
