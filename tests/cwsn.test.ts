import { test } from "node:test"
import assert from "node:assert/strict"
import { cwsnSummary, DISABILITY_TYPES, CWSN_SUPPORTS, type CwsnStudent } from "@/lib/cwsn"

const s = (reviewed: boolean, supports: string[] = []): CwsnStudent => ({
  id: `s-${Math.random()}`,
  name: "N",
  cls: "5A",
  disability: DISABILITY_TYPES[0],
  supports,
  iepGoal: "g",
  reviewed,
  tenantId: "TN-CHN-B1-S1",
})

test("catalogues expose disability types and supports", () => {
  assert.ok(DISABILITY_TYPES.length >= 6)
  assert.ok(CWSN_SUPPORTS.includes("Assistive device"))
})

test("summary counts reviewed, pending and device users", () => {
  const sm = cwsnSummary([
    s(true, ["Assistive device"]),
    s(false, ["Scribe / reader"]),
    s(false, ["Assistive device", "Extra examination time"]),
  ])
  assert.equal(sm.total, 3)
  assert.equal(sm.reviewed, 1)
  assert.equal(sm.pending, 2)
  assert.equal(sm.withDevice, 2)
})
