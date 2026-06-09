import { test } from "node:test"
import assert from "node:assert/strict"
import { progressPct, etaMinutes, advanceStop, busStatus, fleetSummary, PER_STOP_MIN, DELAY_MIN, type Bus } from "@/lib/bus-tracking"

const b = (over: Partial<Bus>): Bus => ({ id: "x", route: "R", stopsTotal: 10, stopsDone: 4, delayed: false, ...over })

test("progressPct is stopsDone/stopsTotal", () => {
  assert.equal(progressPct(b({ stopsDone: 5, stopsTotal: 10 })), 50)
  assert.equal(progressPct(b({ stopsTotal: 0 })), 0)
})

test("ETA = remaining stops * per-stop + delay", () => {
  assert.equal(etaMinutes(b({ stopsDone: 4, stopsTotal: 10 })), 6 * PER_STOP_MIN)
  assert.equal(etaMinutes(b({ stopsDone: 4, stopsTotal: 10, delayed: true })), 6 * PER_STOP_MIN + DELAY_MIN)
  assert.equal(etaMinutes(b({ stopsDone: 10, stopsTotal: 10 })), 0)
})

test("advanceStop clamps at the last stop", () => {
  assert.equal(advanceStop(4, 10), 5)
  assert.equal(advanceStop(10, 10), 10)
})

test("busStatus and fleetSummary classify correctly", () => {
  assert.equal(busStatus(b({ stopsDone: 10, stopsTotal: 10 })), "arrived")
  assert.equal(busStatus(b({ delayed: true })), "delayed")
  assert.equal(busStatus(b({})), "en-route")
  const s = fleetSummary([b({ id: "a" }), b({ id: "b", delayed: true }), b({ id: "c", stopsDone: 10, stopsTotal: 10 })])
  assert.equal(s.buses, 3)
  assert.equal(s.enRoute, 1)
  assert.equal(s.delayed, 1)
  assert.equal(s.arrived, 1)
})
