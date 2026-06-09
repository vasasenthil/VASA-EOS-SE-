import { test } from "node:test"
import assert from "node:assert/strict"
import { visitScore, visitRating, INSPECTION_CHECKLIST } from "@/lib/inspection"

test("visitScore is the checked percentage of the checklist", () => {
  assert.equal(visitScore(INSPECTION_CHECKLIST.length), 100)
  assert.equal(visitScore(0), 0)
  assert.equal(visitScore(4, 8), 50)
})

test("visitRating bands: good >=80, fair >=50, else poor", () => {
  assert.equal(visitRating(100), "good")
  assert.equal(visitRating(80), "good")
  assert.equal(visitRating(60), "fair")
  assert.equal(visitRating(40), "poor")
})
