import { test } from "node:test"
import assert from "node:assert/strict"
import { consumptionPct, leakageFlag, mdmSummary, type MdmEntry } from "@/lib/mdm"

const e = (over: Partial<MdmEntry>): MdmEntry => ({ id: "m", date: "2026-06-01", enrolment: 60, present: 54, mealsServed: 54, menu: "x", ...over })

test("consumption is served/present; zero present is 0", () => {
  assert.equal(consumptionPct(54, 54), 100)
  assert.equal(consumptionPct(60, 30), 50)
  assert.equal(consumptionPct(0, 0), 0)
})

test("leakage when meals served exceeds children present", () => {
  assert.equal(leakageFlag(54, 54), false)
  assert.equal(leakageFlag(54, 60), true)
})

test("summary aggregates days, meals, avg consumption and leakage days", () => {
  const s = mdmSummary([e({ id: "a", present: 50, mealsServed: 50 }), e({ id: "b", present: 40, mealsServed: 48 })])
  assert.equal(s.days, 2)
  assert.equal(s.totalMeals, 98)
  assert.equal(s.leakageDays, 1)
  assert.equal(mdmSummary([]).days, 0)
})
