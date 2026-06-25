import { test } from "node:test"
import assert from "node:assert/strict"
import { viewFor, inrLakh, type FeeCollection } from "@/lib/fees/collection"

function snap(): FeeCollection {
  return { month: "April 2025", billed: 1240000, collected: 840000, defaulters: 87, rteStudents: 213 }
}

test("viewFor derives outstanding and a 1-dp collection percentage", () => {
  const v = viewFor(snap())
  assert.equal(v.outstanding, 400000)
  assert.equal(v.collectedPct, 67.7) // 840000/1240000 = 67.74…
})

test("viewFor never reports negative outstanding (over-collection clamps to 0)", () => {
  const v = viewFor({ ...snap(), collected: 1300000 })
  assert.equal(v.outstanding, 0) // outstanding clamps at 0
  assert.equal(v.collectedPct, 104.8) // 1300000/1240000 = 104.8 (pct is unclamped, reported honestly)
})

test("a zero-billed month does not divide by zero", () => {
  const v = viewFor({ ...snap(), billed: 0, collected: 0 })
  assert.equal(v.outstanding, 0)
  assert.equal(v.collectedPct, 0)
})

test("inrLakh formats rupees as compact lakhs", () => {
  assert.equal(inrLakh(1240000), "₹12.4L")
  assert.equal(inrLakh(840000), "₹8.4L")
  assert.equal(inrLakh(400000), "₹4.0L")
  assert.equal(inrLakh(0), "₹0.0L")
})
