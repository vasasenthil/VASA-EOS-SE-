import { test } from "node:test"
import assert from "node:assert/strict"
import {
  FEE_HEADS,
  FEE_LEDGER,
  TOTAL_BILLED_PER_STUDENT,
  balanceOf,
  statusOf,
  feeSummary,
  inr,
} from "@/lib/fees"

test("total billed per student equals the sum of fee heads", () => {
  assert.equal(
    TOTAL_BILLED_PER_STUDENT,
    FEE_HEADS.reduce((s, h) => s + h.amount, 0),
  )
})

test("balance and status are consistent", () => {
  for (const r of FEE_LEDGER) {
    assert.equal(balanceOf(r), Math.max(r.billed - r.paid, 0))
    const st = statusOf(r)
    if (r.paid >= r.billed) assert.equal(st, "paid")
    else if (r.paid > 0) assert.equal(st, "partial")
    else assert.equal(st, "due")
  }
})

test("fee summary aggregates billed/paid/due and collected %", () => {
  const s = feeSummary()
  assert.equal(s.students, FEE_LEDGER.length)
  assert.equal(s.due, s.billed - s.paid)
  assert.ok(s.collectedPct >= 0 && s.collectedPct <= 100)
})

test("inr formats with the rupee sign", () => {
  assert.equal(inr(0), "₹0")
  assert.match(inr(1000), /^₹/)
})
