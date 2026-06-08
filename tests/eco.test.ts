import { test } from "node:test"
import assert from "node:assert/strict"
import { ecoSummary, ECO_ACTIVITIES, type EcoActivity } from "@/lib/eco"

const a = (saplings: number, survived: number): EcoActivity => ({
  id: `a-${Math.random()}`,
  title: "t",
  type: ECO_ACTIVITIES[0],
  saplings,
  survived,
  date: "2026-06-05",
  tenantId: "TN-CHN-B1-S1",
})

test("activity catalogue is non-empty", () => {
  assert.ok(ECO_ACTIVITIES.includes("Tree plantation"))
})

test("summary totals saplings planted, survived and survival rate", () => {
  const s = ecoSummary([a(100, 80), a(50, 40)])
  assert.equal(s.activities, 2)
  assert.equal(s.saplingsPlanted, 150)
  assert.equal(s.saplingsSurvived, 120)
  assert.equal(s.survivalPct, 80)
})

test("survived is capped at planted and zero planted yields zero rate", () => {
  assert.equal(ecoSummary([a(10, 99)]).saplingsSurvived, 10)
  assert.equal(ecoSummary([a(0, 0)]).survivalPct, 0)
})
