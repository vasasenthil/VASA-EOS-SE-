import { test } from "node:test"
import assert from "node:assert/strict"
import { demoTiers, demoOrganizationalUnits, demoRoles } from "@/lib/governance/demo"

test("demo tiers are the 7 governance levels in order", () => {
  const tiers = demoTiers()
  assert.equal(tiers.length, 7)
  assert.deepEqual(tiers.map((t) => t.name), ["National", "State", "Directorate", "District", "Block", "Cluster", "School"])
  assert.deepEqual(tiers.map((t) => t.level_order), [1, 2, 3, 4, 5, 6, 7])
})

test("demo organizational units form a valid TN hierarchy with resolvable parents", () => {
  const ous = demoOrganizationalUnits()
  assert.ok(ous.length >= 6)
  const ids = new Set(ous.map((o) => o.id))
  // Every non-root parent reference resolves to another unit in the set.
  for (const o of ous) {
    if (o.parent_ou_id) assert.ok(ids.has(o.parent_ou_id), `dangling parent ${o.parent_ou_id}`)
  }
  // The root is the State of Tamil Nadu.
  const root = ous.find((o) => o.parent_ou_id === null)
  assert.equal(root?.name, "Tamil Nadu")
  // Each unit carries a valid tier id.
  const tierIds = new Set(demoTiers().map((t) => t.id))
  assert.ok(ous.every((o) => tierIds.has(o.tier_id)))
})

test("demo roles include ADMIN and are well-formed", () => {
  const roles = demoRoles()
  assert.ok(roles.some((r) => r.name === "ADMIN"))
  assert.ok(roles.every((r) => typeof r.is_system_role === "boolean" && r.id && r.name))
})
