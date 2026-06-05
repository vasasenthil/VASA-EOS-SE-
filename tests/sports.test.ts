import { test } from "node:test"
import assert from "node:assert/strict"
import { sportsSummary, MEDAL_POINTS, type SportResult } from "@/lib/sports"

const r = (event: string, medal: SportResult["medal"]): SportResult => ({ id: `${event}-${medal}`, event, student: "A", medal })

test("medal points are gold 5 / silver 3 / bronze 1 / participation 0", () => {
  assert.equal(MEDAL_POINTS.gold, 5)
  assert.equal(MEDAL_POINTS.participation, 0)
})

test("summary tallies medals, distinct events and points", () => {
  const results = [r("100m", "gold"), r("Long Jump", "silver"), r("100m", "bronze"), r("Chess", "participation")]
  const s = sportsSummary(results)
  assert.equal(s.results, 4)
  assert.equal(s.events, 3) // 100m, Long Jump, Chess
  assert.equal(s.gold, 1)
  assert.equal(s.silver, 1)
  assert.equal(s.bronze, 1)
  assert.equal(s.points, 5 + 3 + 1 + 0)
})
