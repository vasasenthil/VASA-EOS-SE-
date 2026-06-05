import { test } from "node:test"
import assert from "node:assert/strict"
import { excursionSummary, isTripReady, type Trip } from "@/lib/excursions"

const t = (strength: number, consentsReceived: number): Trip => ({
  id: `t-${Math.random()}`,
  destination: "Museum",
  date: "2026-07-01",
  classGroup: "6-8",
  strength,
  consentsReceived,
})

test("a trip is ready only with full consent and non-zero strength", () => {
  assert.equal(isTripReady(t(30, 30)), true)
  assert.equal(isTripReady(t(30, 29)), false)
  assert.equal(isTripReady(t(0, 0)), false)
})

test("summary totals students, consents (capped), rate and ready trips", () => {
  const s = excursionSummary([t(30, 30), t(20, 10), t(10, 99)])
  assert.equal(s.trips, 3)
  assert.equal(s.students, 60)
  assert.equal(s.consentsReceived, 50) // 30 + 10 + min(99,10)
  assert.equal(s.consentPct, 83)
  assert.equal(s.readyTrips, 2)
})

test("empty list yields zero consent rate", () => {
  assert.equal(excursionSummary([]).consentPct, 0)
})
