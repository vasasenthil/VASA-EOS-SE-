import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { buildInventoryLedger, inventoryLedgerToMarkdown } from "@/lib/governance/inventory-ledger"
import { buildProductionAcceptancePack, productionAcceptancePackToMarkdown } from "@/lib/governance/production-acceptance"
import { AI_CONTROL_TOWER, GOVERNANCE_TIERS, ROLE_SCOPE_MATRIX, TENANCY_HIERARCHY, governanceHierarchySummary } from "@/lib/governance/hierarchy"

const repoRoot = process.cwd()

test("governance inventory ledger enumerates critical production artefacts", () => {
  const ledger = buildInventoryLedger(repoRoot, "2026-07-23T00:00:00.000Z")
  assert.ok((ledger.summary.route ?? 0) > 100)
  assert.ok((ledger.summary.api ?? 0) > 20)
  assert.ok((ledger.summary.module ?? 0) > 100)
  assert.ok(ledger.items.some((item) => item.path === "app/schemes/create/page.tsx"))
  assert.ok(ledger.items.some((item) => item.path === "app/schemes/edit/[schemeId]/page.tsx"))
  assert.ok(ledger.items.some((item) => item.path === "lib/production"))
  assert.match(inventoryLedgerToMarkdown(ledger), /Governance Inventory Ledger/)
})

test("governance hierarchy is a complete T0-T6 and G1-G7 operating model", () => {
  assert.deepEqual(TENANCY_HIERARCHY.map((node) => node.id), ["T0", "T1", "T2", "T3", "T4", "T5", "T6"])
  assert.deepEqual(GOVERNANCE_TIERS.map((node) => node.id), ["G1", "G2", "G3", "G4", "G5", "G6", "G7"])
  assert.equal(AI_CONTROL_TOWER.length, 3)
  assert.ok(ROLE_SCOPE_MATRIX.some((row) => row.role === "SECRETARY" && row.governanceTier === "G5"))
  assert.deepEqual(governanceHierarchySummary(), { tenancyTiers: 7, governanceTiers: 7, aiControlBodies: 3, roleMappings: ROLE_SCOPE_MATRIX.length })
  assert.equal(existsSync(join(repoRoot, "app/governance/hierarchy/page.tsx")), true)
})

test("production acceptance pack embeds inventory, cutover and governance evidence", () => {
  const pack = buildProductionAcceptancePack({ root: repoRoot, generatedAt: "2026-07-23T00:00:00.000Z", env: { NODE_ENV: "production" } })
  assert.ok(pack.inventory.readiness.total > 0)
  assert.ok(pack.cutover.gates.some((gate) => gate.id === "governance:acceptance-pack"))
  assert.equal(pack.sections.some((section) => section.id === "governance-hierarchy" && section.status === "pass"), true)
  assert.match(productionAcceptancePackToMarkdown(pack), /Production Acceptance Pack/)
  assert.equal(existsSync(join(repoRoot, "app/governance/acceptance-pack/page.tsx")), true)
})
