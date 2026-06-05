import { test } from "node:test"
import assert from "node:assert/strict"
import { nextTcStatus, tcSummary, tcNumber, TC_FLOW, type TcRequest } from "@/lib/tc"

const r = (status: TcRequest["status"]): TcRequest => ({
  id: `r-${Math.random()}`,
  student: "N",
  cls: "10A",
  reason: "Relocation / family transfer",
  status,
  date: "2026-06-05",
})

test("status advances through the flow and clamps at issued", () => {
  assert.equal(nextTcStatus("requested"), "verified")
  assert.equal(nextTcStatus("verified"), "issued")
  assert.equal(nextTcStatus("issued"), "issued")
})

test("flow has three ordered stages", () => {
  assert.deepEqual(TC_FLOW, ["requested", "verified", "issued"])
})

test("summary counts issued vs pending", () => {
  const s = tcSummary([r("requested"), r("verified"), r("issued")])
  assert.equal(s.total, 3)
  assert.equal(s.issued, 1)
  assert.equal(s.pending, 2)
})

test("tc number is zero-padded with year", () => {
  assert.equal(tcNumber(2026, 7), "TC/2026/0007")
})
