import { test } from "node:test"
import assert from "node:assert/strict"
import { HOSTELS, freeBeds, canAllocate, allocate, vacate, hostelSummary } from "@/lib/hostel"

test("freeBeds and canAllocate reflect capacity", () => {
  const h = { id: "x", name: "n", type: "KGBV" as const, district: "d", capacity: 100, occupied: 100 }
  assert.equal(freeBeds(h), 0)
  assert.equal(canAllocate(h), false)
  assert.equal(canAllocate({ ...h, occupied: 99 }), true)
})

test("allocate never exceeds capacity; vacate never goes below zero", () => {
  assert.equal(allocate(99, 100), 100)
  assert.equal(allocate(100, 100), 100)
  assert.equal(vacate(1), 0)
  assert.equal(vacate(0), 0)
})

test("hostelSummary aggregates capacity and occupancy", () => {
  const s = hostelSummary(HOSTELS)
  assert.equal(s.count, HOSTELS.length)
  assert.ok(s.occupancyPct >= 0 && s.occupancyPct <= 100)
})
