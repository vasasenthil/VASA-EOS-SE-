import { test } from "node:test"
import assert from "node:assert/strict"
import { washScore, washRating, WASH_CHECKLIST } from "@/lib/wash"

test("washScore is the checked percentage", () => {
  assert.equal(washScore(WASH_CHECKLIST.length), 100)
  assert.equal(washScore(0), 0)
  assert.equal(washScore(7, 14), 50)
})

test("washRating bands", () => {
  assert.equal(washRating(95), "5-star")
  assert.equal(washRating(80), "4-star")
  assert.equal(washRating(60), "3-star")
  assert.equal(washRating(30), "needs improvement")
})
