import { test } from "node:test"
import assert from "node:assert/strict"
import { adoptionSummary, USAGE_SERIES, type UsageDay } from "@/lib/adoption"

test("adoptionSummary reports the latest DAU and bounded stickiness", () => {
  const s = adoptionSummary()
  assert.equal(s.dau, USAGE_SERIES[USAGE_SERIES.length - 1].activeUsers)
  assert.ok(s.stickiness >= 0 && s.stickiness <= 100)
  assert.ok(s.loopCompletionPct >= 0 && s.loopCompletionPct <= 100)
})

test("week-over-week growth is positive on the seeded growth series", () => {
  assert.ok(adoptionSummary().weekOverWeekGrowthPct > 0)
})

test("adoptionSummary is safe on an empty series", () => {
  const s = adoptionSummary([])
  assert.deepEqual(s, { dau: 0, wau: 0, stickiness: 0, weekOverWeekGrowthPct: 0, loopCompletionPct: 0 })
})

test("growth is zero when there is no prior week", () => {
  const short: UsageDay[] = [{ date: "2026-06-05", activeUsers: 10, loopCompletedPct: 50 }]
  assert.equal(adoptionSummary(short).weekOverWeekGrowthPct, 0)
  assert.equal(adoptionSummary(short).dau, 10)
})
