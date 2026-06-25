import { test } from "node:test"
import assert from "node:assert/strict"
import { rateFor, rollup, HEALTHY_PCT, CLASS_ORDER, type ClassDay } from "@/lib/attendance/class-day"

test("rateFor computes a 1-dp percentage and bands at the healthy threshold", () => {
  const r = rateFor({ cls: "Class X", enrolled: 238, present: 224 })
  assert.equal(r.pct, 94.1)
  assert.equal(r.status, "Good")
  // Exactly at the threshold is Good; just below is Watch.
  assert.equal(rateFor({ cls: "Class A", enrolled: 100, present: 90 }).status, "Good")
  assert.equal(rateFor({ cls: "Class B", enrolled: 100, present: 89 }).status, "Watch")
})

test("rateFor is safe for an empty class (no divide-by-zero)", () => {
  const r = rateFor({ cls: "Class Z", enrolled: 0, present: 0 })
  assert.equal(r.pct, 0)
  assert.equal(r.status, "Watch")
})

test("rollup totals enrolled/present and the school-wide average", () => {
  const rows: ClassDay[] = [
    { cls: "Class VI", enrolled: 180, present: 168 },
    { cls: "Class VII", enrolled: 195, present: 178 },
  ]
  const r = rollup(rows)
  assert.equal(r.enrolled, 375)
  assert.equal(r.present, 346)
  assert.equal(r.pct, 92.3) // 346/375 = 92.266…
  assert.equal(r.classes.length, 2)
})

test("rollup orders classes by CLASS_ORDER regardless of input order", () => {
  const rows: ClassDay[] = [
    { cls: "Class X", enrolled: 10, present: 9 },
    { cls: "Class VI", enrolled: 10, present: 9 },
    { cls: "Class IX", enrolled: 10, present: 9 },
  ]
  assert.deepEqual(rollup(rows).classes.map((c) => c.cls), ["Class VI", "Class IX", "Class X"])
})

test("an empty roll-up is zeroed, not NaN", () => {
  const r = rollup([])
  assert.equal(r.enrolled, 0)
  assert.equal(r.present, 0)
  assert.equal(r.pct, 0)
})

test("the healthy threshold and class vocabulary are stable", () => {
  assert.equal(HEALTHY_PCT, 90)
  assert.equal(CLASS_ORDER.length, 12)
  assert.equal(CLASS_ORDER[0], "Class I")
  assert.equal(CLASS_ORDER[11], "Class XII")
})
