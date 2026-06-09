import { test } from "node:test"
import assert from "node:assert/strict"
import {
  NEP_IMPL_SEED,
  IMPL_STATUSES,
  ragBand,
  statusDistribution,
  ragDistribution,
  byThrustArea,
  byRegionType,
  atRisk,
  analyticsSummary,
  type ImplRow,
} from "@/lib/tracking/analytics"

function row(over: Partial<ImplRow> = {}): ImplRow {
  return {
    policyId: "P",
    policy: "Policy",
    thrustArea: "Foundational Literacy & Numeracy",
    region: "Tamil Nadu",
    regionType: "State",
    status: "In Progress",
    progress: 50,
    updatedAt: "2026-05-01",
    ...over,
  }
}

test("ragBand thresholds: Red <34, Amber 34–66, Green >=67", () => {
  assert.equal(ragBand(0), "Red")
  assert.equal(ragBand(33), "Red")
  assert.equal(ragBand(34), "Amber")
  assert.equal(ragBand(66), "Amber")
  assert.equal(ragBand(67), "Green")
  assert.equal(ragBand(100), "Green")
})

test("statusDistribution returns every status, counts correct", () => {
  const dist = statusDistribution([row({ status: "Delayed" }), row({ status: "Delayed" }), row({ status: "Completed" })])
  assert.deepEqual(dist.map((d) => d.status), IMPL_STATUSES)
  assert.equal(dist.find((d) => d.status === "Delayed")?.count, 2)
  assert.equal(dist.find((d) => d.status === "Completed")?.count, 1)
  assert.equal(dist.find((d) => d.status === "Not Started")?.count, 0)
})

test("ragDistribution buckets by band", () => {
  const dist = ragDistribution([row({ progress: 10 }), row({ progress: 50 }), row({ progress: 90 })])
  assert.equal(dist.find((d) => d.band === "Red")?.count, 1)
  assert.equal(dist.find((d) => d.band === "Amber")?.count, 1)
  assert.equal(dist.find((d) => d.band === "Green")?.count, 1)
})

test("byThrustArea averages progress and sorts highest first", () => {
  const g = byThrustArea([
    row({ thrustArea: "A", progress: 40 }),
    row({ thrustArea: "A", progress: 60 }),
    row({ thrustArea: "B", progress: 90 }),
  ])
  assert.equal(g[0].key, "B")
  assert.equal(g[0].avgProgress, 90)
  assert.equal(g[1].key, "A")
  assert.equal(g[1].avgProgress, 50)
  assert.equal(g[1].count, 2)
})

test("byRegionType groups by tier", () => {
  const g = byRegionType([row({ regionType: "District", progress: 80 }), row({ regionType: "State", progress: 40 })])
  assert.equal(g[0].key, "District")
  assert.equal(g[0].avgProgress, 80)
})

test("atRisk includes Delayed and Red-band items, lowest progress first", () => {
  const r = atRisk([
    row({ status: "On Track", progress: 80 }), // excluded
    row({ status: "Delayed", progress: 55 }), // delayed (amber) included
    row({ status: "In Progress", progress: 20 }), // red included
  ])
  assert.equal(r.length, 2)
  assert.equal(r[0].progress, 20) // sorted ascending
})

test("analyticsSummary computes averages and shares; empty is zeroed", () => {
  const s = analyticsSummary([row({ status: "Completed", progress: 100 }), row({ status: "Delayed", progress: 20 })])
  assert.equal(s.total, 2)
  assert.equal(s.avgProgress, 60)
  assert.equal(s.onTrackPct, 50) // 1 completed of 2
  assert.equal(s.completed, 1)
  assert.equal(s.atRiskCount, 1)

  assert.deepEqual(analyticsSummary([]), { total: 0, avgProgress: 0, onTrackPct: 0, atRiskCount: 0, completed: 0 })
})

test("seed dataset is coherent and covers multiple thrust areas", () => {
  assert.ok(NEP_IMPL_SEED.length >= 12)
  assert.ok(byThrustArea(NEP_IMPL_SEED).length >= 6)
  for (const r of NEP_IMPL_SEED) {
    assert.ok(r.progress >= 0 && r.progress <= 100)
    assert.ok(IMPL_STATUSES.includes(r.status))
  }
})
