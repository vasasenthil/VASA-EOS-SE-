import { test } from "node:test"
import assert from "node:assert/strict"
import { addMinutes, generateSlots, ptmSummary, type Slot } from "@/lib/ptm"

test("addMinutes advances time and wraps within a day", () => {
  assert.equal(addMinutes("10:00", 15), "10:15")
  assert.equal(addMinutes("10:50", 15), "11:05")
  assert.equal(addMinutes("23:50", 20), "00:10")
})

test("generateSlots produces evenly spaced slots", () => {
  const slots = generateSlots("10:00", 4, 15)
  assert.equal(slots.length, 4)
  assert.deepEqual(slots.map((s) => s.time), ["10:00", "10:15", "10:30", "10:45"])
})

test("ptmSummary counts booked vs free", () => {
  const slots: Slot[] = [{ id: "a", time: "10:00", parent: "P" }, { id: "b", time: "10:15" }]
  const s = ptmSummary(slots)
  assert.equal(s.total, 2)
  assert.equal(s.booked, 1)
  assert.equal(s.free, 1)
})
