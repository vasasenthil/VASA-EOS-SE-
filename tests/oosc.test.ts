import { test } from "node:test"
import assert from "node:assert/strict"
import { nextOoscStatus, ooscSummary, OOSC_FLOW, type OoscChild } from "@/lib/oosc"

const c = (status: OoscChild["status"]): OoscChild => ({
  id: `c-${Math.random()}`,
  name: "N",
  age: 9,
  reason: "Migration",
  status,
  targetClass: "4",
})

test("status advances through the flow and clamps at mainstreamed", () => {
  assert.equal(nextOoscStatus("identified"), "enrolled")
  assert.equal(nextOoscStatus("enrolled"), "bridging")
  assert.equal(nextOoscStatus("bridging"), "mainstreamed")
  assert.equal(nextOoscStatus("mainstreamed"), "mainstreamed")
})

test("flow has four ordered stages", () => {
  assert.deepEqual(OOSC_FLOW, ["identified", "enrolled", "bridging", "mainstreamed"])
})

test("summary counts stages and mainstream rate", () => {
  const s = ooscSummary([c("identified"), c("bridging"), c("mainstreamed"), c("mainstreamed")])
  assert.equal(s.total, 4)
  assert.equal(s.identified, 1)
  assert.equal(s.bridging, 1)
  assert.equal(s.mainstreamed, 2)
  assert.equal(s.mainstreamPct, 50)
})

test("empty list yields zero rate", () => {
  assert.equal(ooscSummary([]).mainstreamPct, 0)
})
