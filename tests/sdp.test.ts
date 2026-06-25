import { test } from "node:test"
import assert from "node:assert/strict"
import { sdpSummary, TOTAL_GRANT, inr, type SdpPriority } from "@/lib/sdp"

const p = (amount: number): SdpPriority => ({ id: `p${amount}`, title: "t", head: "Infrastructure", amount })

test("summary computes allocated, balance and utilisation", () => {
  const s = sdpSummary([p(100000), p(150000)])
  assert.equal(s.allocated, 250000)
  assert.equal(s.balance, TOTAL_GRANT - 250000)
  assert.equal(s.utilisationPct, 50)
  assert.equal(s.overBudget, false)
})

test("over-budget is flagged and balance goes negative", () => {
  const s = sdpSummary([p(TOTAL_GRANT + 1000)])
  assert.equal(s.overBudget, true)
  assert.ok(s.balance < 0)
})

test("inr formats rupees", () => {
  assert.match(inr(500000), /^₹/)
})
