import { test } from "node:test"
import assert from "node:assert/strict"
import { vocSummary, VOC_TRADES, NSQF_LEVELS, type VocEnrolment } from "@/lib/vocational"

const e = (trade: string, certified: boolean): VocEnrolment => ({
  id: `e-${Math.random()}`,
  student: "N",
  trade,
  level: 2,
  certified,
})

test("catalogues expose trades and NSQF levels", () => {
  assert.ok(VOC_TRADES.length >= 8)
  assert.deepEqual(NSQF_LEVELS, [1, 2, 3, 4])
})

test("summary counts certified, in-progress and distinct trades", () => {
  const s = vocSummary([e("Agriculture", true), e("Agriculture", false), e("Retail", false)])
  assert.equal(s.total, 3)
  assert.equal(s.certified, 1)
  assert.equal(s.inProgress, 2)
  assert.equal(s.trades, 2)
})
