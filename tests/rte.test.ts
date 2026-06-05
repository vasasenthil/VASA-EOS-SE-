import { test } from "node:test"
import assert from "node:assert/strict"
import { nextRteStatus, rteSummary, RTE_FLOW, type RteApplicant } from "@/lib/rte"

const a = (status: RteApplicant["status"]): RteApplicant => ({
  id: `a-${Math.random()}`,
  name: "N",
  category: "EWS (economically weaker)",
  status,
  date: "2026-06-05",
})

test("status advances through the flow and clamps at admitted", () => {
  assert.equal(nextRteStatus("applied"), "verified")
  assert.equal(nextRteStatus("verified"), "allotted")
  assert.equal(nextRteStatus("allotted"), "admitted")
  assert.equal(nextRteStatus("admitted"), "admitted")
})

test("flow has four ordered stages", () => {
  assert.deepEqual(RTE_FLOW, ["applied", "verified", "allotted", "admitted"])
})

test("summary computes verified, admitted, vacancy and fill rate", () => {
  const s = rteSummary([a("applied"), a("verified"), a("allotted"), a("admitted"), a("admitted")], 4)
  assert.equal(s.quotaSeats, 4)
  assert.equal(s.applied, 5)
  assert.equal(s.verified, 4) // verified + allotted + admitted x2
  assert.equal(s.admitted, 2)
  assert.equal(s.vacant, 2)
  assert.equal(s.fillPct, 50)
})

test("zero quota yields zero fill and no negative vacancy", () => {
  const s = rteSummary([a("admitted")], 0)
  assert.equal(s.fillPct, 0)
  assert.equal(s.vacant, 0)
})
