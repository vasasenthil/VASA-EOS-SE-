import { test } from "node:test"
import assert from "node:assert/strict"
import { bankingSummary, applyTxn, inr, type Account } from "@/lib/banking"

const acc = (balance: number): Account => ({
  id: `a-${Math.random()}`,
  student: "N",
  cls: "6A",
  balance,
})

test("deposit adds, withdraw subtracts and never overdraws", () => {
  assert.equal(applyTxn(100, "deposit", 50), 150)
  assert.equal(applyTxn(100, "withdraw", 30), 70)
  assert.equal(applyTxn(100, "withdraw", 200), 0)
  assert.equal(applyTxn(100, "deposit", 0), 100) // non-positive amount ignored
})

test("summary totals savings, average and active savers", () => {
  const s = bankingSummary([acc(100), acc(0), acc(300)])
  assert.equal(s.accounts, 3)
  assert.equal(s.totalSavings, 400)
  assert.equal(s.avgBalance, 133)
  assert.equal(s.activeSavers, 2)
})

test("empty bank yields zero average and inr formats rupees", () => {
  assert.equal(bankingSummary([]).avgBalance, 0)
  assert.match(inr(2500), /^₹/)
})
