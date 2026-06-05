import { test } from "node:test"
import assert from "node:assert/strict"
import { cpdSummary, ANNUAL_CPD_HOURS, type CpdRecord } from "@/lib/cpd"

const rec = (hours: number): CpdRecord => ({ id: `x${hours}`, title: "t", provider: "p", hours, date: "2026-01-01", mode: "online" })

test("summary totals hours and reports unmet below the requirement", () => {
  const s = cpdSummary([rec(10), rec(8)])
  assert.equal(s.totalHours, 18)
  assert.equal(s.met, false)
  assert.equal(s.pct, Math.round((18 / ANNUAL_CPD_HOURS) * 100))
})

test("requirement met at or above the annual hours; pct caps at 100", () => {
  const s = cpdSummary([rec(ANNUAL_CPD_HOURS), rec(20)])
  assert.equal(s.met, true)
  assert.equal(s.pct, 100)
})

test("empty log is zero", () => {
  const s = cpdSummary([])
  assert.equal(s.totalHours, 0)
  assert.equal(s.met, false)
})
