import { test } from "node:test"
import assert from "node:assert/strict"
import { drillSummary, isWithinTarget, DRILL_TYPES, DRILL_TARGET_SEC, type Drill } from "@/lib/drills"

const d = (evacTimeSec: number, participants = 100): Drill => ({
  id: `d-${Math.random()}`,
  type: DRILL_TYPES[0],
  date: "2026-06-05",
  evacTimeSec,
  participants,
  observations: "",
  tenantId: "TN-CHN-B1-S1",
})

test("within target needs a positive time at or under the target", () => {
  assert.equal(isWithinTarget(d(DRILL_TARGET_SEC)), true)
  assert.equal(isWithinTarget(d(DRILL_TARGET_SEC + 1)), false)
  assert.equal(isWithinTarget(d(0)), false)
})

test("summary averages only timed drills and counts within-target", () => {
  const s = drillSummary([d(120, 50), d(360, 80), d(0, 30)])
  assert.equal(s.total, 3)
  assert.equal(s.participants, 160)
  assert.equal(s.avgEvacSec, 240) // (120+360)/2
  assert.equal(s.withinTarget, 1)
})

test("no timed drills yields zero average", () => {
  assert.equal(drillSummary([d(0)]).avgEvacSec, 0)
})
