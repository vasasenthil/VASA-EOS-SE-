import { test } from "node:test"
import assert from "node:assert/strict"
import { waterSummary, isPhSafe, WATER_SOURCES, type WaterTest } from "@/lib/water"

const t = (source: string, result: WaterTest["result"]): WaterTest => ({
  id: `t-${Math.random()}`,
  source,
  date: "2026-06-05",
  ph: 7,
  result,
  remarks: "",
  tenantId: "TN-CHN-B1-S1",
})

test("pH safety follows IS 10500 range 6.5-8.5", () => {
  assert.equal(isPhSafe(7.2), true)
  assert.equal(isPhSafe(6.5), true)
  assert.equal(isPhSafe(8.5), true)
  assert.equal(isPhSafe(5.9), false)
  assert.equal(isPhSafe(9.1), false)
})

test("sources catalogue is non-empty", () => {
  assert.ok(WATER_SOURCES.includes("Borewell"))
})

test("summary counts safe, unsafe, distinct sources and safe rate", () => {
  const s = waterSummary([t("Borewell", "safe"), t("Borewell", "unsafe"), t("RO / purifier unit", "safe")])
  assert.equal(s.tests, 3)
  assert.equal(s.safe, 2)
  assert.equal(s.unsafe, 1)
  assert.equal(s.sources, 2)
  assert.equal(s.safePct, 67)
})

test("empty log yields zero safe rate", () => {
  assert.equal(waterSummary([]).safePct, 0)
})
