import { test } from "node:test"
import assert from "node:assert/strict"
import {
  GEM_PROCUREMENTS,
  procurementById,
  l1Bid,
  savings,
  savingsPct,
  gemSummary,
  toCSV,
} from "@/lib/procurement/gem"

test("L1 is the lowest price among technically qualified bids only", () => {
  const p = procurementById("GEM-2026-0451")! // LowCost Press is cheapest but NOT qualified
  const l1 = l1Bid(p)!
  assert.equal(l1.vendor, "Bharat Print House") // 4,420,000 — lowest qualified
  assert.ok(l1.technicallyQualified)
})

test("a disqualified low bid is ignored even if it is the cheapest", () => {
  const p = procurementById("GEM-2026-0544")! // FastFabric cheapest but disqualified
  assert.equal(l1Bid(p)?.vendor, "Handloom Co-op")
})

test("a tender with no bids has no L1 and zero saving", () => {
  const p = procurementById("GEM-2026-0530")! // published, no bids
  assert.equal(l1Bid(p), undefined)
  assert.equal(savings(p), 0)
  assert.equal(savingsPct(p), 0)
})

test("savings are estimate minus L1, never negative", () => {
  const p = procurementById("GEM-2026-0451")! // 4,800,000 − 4,420,000 = 380,000
  assert.equal(savings(p), 380000)
  assert.equal(savingsPct(p), Math.round((380000 / 4800000) * 100))
})

test("summary tallies awarded value and total savings", () => {
  const s = gemSummary()
  assert.equal(s.procurements, GEM_PROCUREMENTS.length)
  assert.equal(s.awarded + s.open, s.procurements)
  const awarded = GEM_PROCUREMENTS.filter((p) => p.status === "awarded")
  assert.equal(s.totalAwarded, awarded.reduce((n, p) => n + (l1Bid(p)?.price ?? 0), 0))
  assert.equal(s.totalSavings, awarded.reduce((n, p) => n + savings(p), 0))
  assert.ok(s.totalSavings > 0)
})

test("CSV has a header plus one row per procurement", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "ID,Item,Category,Estimate,L1 vendor,L1 price,Saving %,Status")
  assert.equal(lines.length, GEM_PROCUREMENTS.length + 1)
})
