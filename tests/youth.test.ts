import { test } from "node:test"
import assert from "node:assert/strict"
import { youthSummary, YOUTH_WINGS, type Cadet } from "@/lib/youth"

const c = (wing: string, serviceHours: number): Cadet => ({
  id: `c-${Math.random()}`,
  name: "N",
  cls: "9A",
  wing,
  serviceHours,
  tenantId: "TN-CHN-B1-S1",
})

test("wing catalogue is non-empty", () => {
  assert.ok(YOUTH_WINGS.includes("NSS"))
})

test("summary counts cadets, distinct wings and average hours", () => {
  const s = youthSummary([c("NSS", 10), c("NSS", 20), c("Scouts & Guides", 30)])
  assert.equal(s.cadets, 3)
  assert.equal(s.wings, 2)
  assert.equal(s.totalHours, 60)
  assert.equal(s.avgHours, 20)
})

test("empty register yields zero average", () => {
  assert.equal(youthSummary([]).avgHours, 0)
})
