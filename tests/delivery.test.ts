import { test } from "node:test"
import assert from "node:assert/strict"
import {
  DELIVERY_CAPABILITIES,
  GEOGRAPHIES,
  BARRIERS,
  tamilDialects,
  capabilityById,
  byBarrier,
  uncoveredBarriers,
  deliverySummary,
  toCSV,
} from "@/lib/accessibility/delivery"
import { LOCALES } from "@/lib/i18n"

test("every last-mile barrier is addressed by at least one capability", () => {
  assert.deepEqual(uncoveredBarriers(), [])
  assert.equal(deliverySummary().barriersCovered, BARRIERS.length)
})

test("capabilities are well-formed: valid status, >=1 barrier", () => {
  for (const c of DELIVERY_CAPABILITIES) {
    assert.ok(["enforced", "partial", "infra"].includes(c.status))
    assert.ok(c.barriers.length >= 1)
    assert.ok(c.name && c.capability)
  }
})

test("the '8 Tamil dialects' claim is the actual i18n locale data (self-verifying)", () => {
  const fromLocale = LOCALES.find((l) => l.code === "ta")?.dialects ?? []
  assert.deepEqual(tamilDialects(), fromLocale)
  assert.equal(tamilDialects().length, 8)
  assert.equal(deliverySummary().tamilDialects, 8)
})

test("connectivity & electricity barriers are covered; IVR serves literacy", () => {
  assert.ok(byBarrier("connectivity").length >= 2) // offline + sync + 2G
  assert.ok(byBarrier("electricity").some((c) => c.id === "solar-edge"))
  assert.equal(capabilityById("ivr-voice")?.barriers.includes("literacy"), true)
})

test("geographies cover rural, urban, hills, coastal, border and tribal", () => {
  const ids = GEOGRAPHIES.map((g) => g.id)
  for (const g of ["rural", "urban", "hills", "coastal", "border", "tribal"]) assert.ok(ids.includes(g))
})

test("CSV has a header plus one row per capability", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Capability,What it does,Barriers,Status")
  assert.equal(lines.length, DELIVERY_CAPABILITIES.length + 1)
})
