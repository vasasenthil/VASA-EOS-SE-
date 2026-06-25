import { test } from "node:test"
import assert from "node:assert/strict"
import { adjust, isLow } from "@/lib/stock"

test("isLow triggers at or below the reorder level", () => {
  assert.equal(isLow(100, 100), true)
  assert.equal(isLow(99, 100), true)
  assert.equal(isLow(101, 100), false)
})

test("issue draws stock down and never below zero", () => {
  assert.equal(adjust(50, "issue", 20), 30)
  assert.equal(adjust(10, "issue", 25), 0)
})

test("receive adds stock; quantities are floored and non-negative", () => {
  assert.equal(adjust(50, "receive", 20), 70)
  assert.equal(adjust(50, "issue", -5), 50)
  assert.equal(adjust(50, "receive", 3.9), 53)
})
