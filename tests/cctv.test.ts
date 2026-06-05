import { test } from "node:test"
import assert from "node:assert/strict"
import { cctvSummary, uncoveredZones, CCTV_ZONES, type Camera } from "@/lib/cctv"

const cam = (zone: string, working: boolean): Camera => ({
  id: `c-${Math.random()}`,
  location: "loc",
  zone,
  working,
})

test("zone catalogue is non-empty", () => {
  assert.ok(CCTV_ZONES.includes("Main gate"))
})

test("summary counts working, down, covered zones and uptime", () => {
  const s = cctvSummary([cam("Main gate", true), cam("Main gate", false), cam("Corridor", true)])
  assert.equal(s.total, 3)
  assert.equal(s.working, 2)
  assert.equal(s.down, 1)
  assert.equal(s.zonesCovered, 2)
  assert.equal(s.uptimePct, 67)
})

test("empty register yields zero uptime", () => {
  assert.equal(cctvSummary([]).uptimePct, 0)
})

test("uncovered zones exclude those with a working camera", () => {
  const uncovered = uncoveredZones([cam("Main gate", true), cam("Corridor", false)])
  assert.ok(!uncovered.includes("Main gate"))
  assert.ok(uncovered.includes("Corridor"))
})
