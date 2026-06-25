import { test } from "node:test"
import assert from "node:assert/strict"
import { isOnPremises, visitorSummary, type Visitor } from "@/lib/visitors"

const v = (over: Partial<Visitor>): Visitor => ({ id: "v", name: "A", purpose: "Official visit", meeting: "Principal", inTime: "09:00", tenantId: "TN-CHN-B1-S1", ...over })

test("isOnPremises is true until checked out", () => {
  assert.equal(isOnPremises(v({})), true)
  assert.equal(isOnPremises(v({ outTime: "10:00" })), false)
})

test("summary counts on-premises vs checked-out", () => {
  const list = [v({ id: "a" }), v({ id: "b", outTime: "11:00" }), v({ id: "c" })]
  const s = visitorSummary(list)
  assert.equal(s.total, 3)
  assert.equal(s.onPremises, 2)
  assert.equal(s.checkedOut, 1)
})
