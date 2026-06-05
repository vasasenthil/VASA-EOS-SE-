import { test } from "node:test"
import assert from "node:assert/strict"
import { cookSummary, inr, type Cook } from "@/lib/cooks"

const k = (present: boolean, honorarium = 1000): Cook => ({
  id: `k-${Math.random()}`,
  name: "N",
  role: "Cook",
  honorarium,
  present,
})

test("summary counts presence and totals honoraria", () => {
  const s = cookSummary([k(true, 1000), k(false, 1200), k(true, 1000)])
  assert.equal(s.total, 3)
  assert.equal(s.present, 2)
  assert.equal(s.absent, 1)
  assert.equal(s.honorariumTotal, 3200)
})

test("inr formats rupees with grouping", () => {
  assert.match(inr(125000), /^₹/)
  assert.equal(inr(0), "₹0")
})
