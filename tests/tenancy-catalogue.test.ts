import { test } from "node:test"
import assert from "node:assert/strict"
import {
  TIER_ORDER,
  tierLevel,
  tierCatalogue,
  leafNode,
  governancePath,
  treeViolations,
  tenancySummary,
  canAccessTenant,
  toCSV,
} from "@/lib/tenancy/catalogue"
import { TENANT_TIERS, DEMO_TENANTS } from "@/lib/tenancy"

test("the catalogue covers all seven tiers in order", () => {
  assert.equal(TIER_ORDER.length, 7)
  assert.equal(tierCatalogue().length, TENANT_TIERS.length)
  assert.equal(tierLevel("national"), 0)
  assert.equal(tierLevel("school"), 6)
})

test("the demo tenant tree is a complete, strictly-descending chain (self-verifying)", () => {
  assert.deepEqual(treeViolations(), [])
  const path = governancePath()
  assert.equal(path.length, 7) // national → state → … → school
  assert.deepEqual(path.map((n) => n.tier), TIER_ORDER)
})

test("downward governance: the State governs its descendants, not the reverse", () => {
  const state = DEMO_TENANTS.find((t) => t.tier === "state")!
  const leaf = leafNode()!
  assert.equal(canAccessTenant(DEMO_TENANTS, state.id, leaf.id), true) // TN governs the school
  assert.equal(canAccessTenant(DEMO_TENANTS, leaf.id, state.id), false) // school cannot govern TN
  assert.equal(canAccessTenant(DEMO_TENANTS, state.id, state.id), true) // self
})

test("TN is the sovereign state tenant; each tier maps to a demo node", () => {
  assert.equal(tenancySummary().sovereignState, "Tamil Nadu")
  for (const r of tierCatalogue()) assert.ok(r.node, `tier ${r.tier} should have a demo node`)
})

test("summary tallies tiers, nodes and governance depth", () => {
  const s = tenancySummary()
  assert.equal(s.tiers, TENANT_TIERS.length)
  assert.equal(s.demoNodes, DEMO_TENANTS.length)
  assert.equal(s.depth, 7)
})

test("CSV has a header plus one row per tier", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Level,Tier,Label,TN scale,Demo node")
  assert.equal(lines.length, tierCatalogue().length + 1)
})
