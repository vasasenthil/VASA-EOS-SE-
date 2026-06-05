import { test } from "node:test"
import assert from "node:assert/strict"
import { nextStatus, scholarshipSummary, SCHOLARSHIP_LEDGER, inr } from "@/lib/scholarship"

test("nextStatus advances the pipeline and stops at disbursed", () => {
  assert.equal(nextStatus("eligible"), "applied")
  assert.equal(nextStatus("applied"), "sanctioned")
  assert.equal(nextStatus("sanctioned"), "disbursed")
  assert.equal(nextStatus("disbursed"), "disbursed")
})

test("summary counts sanctioned/disbursed and sums disbursed amount", () => {
  const s = scholarshipSummary(SCHOLARSHIP_LEDGER)
  assert.equal(s.beneficiaries, SCHOLARSHIP_LEDGER.length)
  const expected = SCHOLARSHIP_LEDGER.filter((r) => r.status === "disbursed").reduce((a, r) => a + r.amount, 0)
  assert.equal(s.amountDisbursed, expected)
})

test("inr formats rupees", () => {
  assert.match(inr(12000), /^₹/)
})
