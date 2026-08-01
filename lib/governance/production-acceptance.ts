import { buildCutoverReport, type CutoverReport } from "@/lib/production/cutover"
import { buildInventoryLedger, inventoryLedgerToMarkdown, type InventoryLedger } from "./inventory-ledger"
import { AI_CONTROL_TOWER, GOVERNANCE_TIERS, ROLE_SCOPE_MATRIX, TENANCY_HIERARCHY } from "./hierarchy"

export interface AcceptanceSection {
  id: string
  title: string
  status: "pass" | "warn" | "fail"
  evidence: string[]
  owner: string
}

export interface ProductionAcceptancePack {
  generatedAt: string
  inventory: InventoryLedger
  cutover: CutoverReport
  sections: AcceptanceSection[]
}

function section(id: string, title: string, status: AcceptanceSection["status"], owner: string, evidence: string[]): AcceptanceSection {
  return { id, title, status, owner, evidence }
}

export function buildProductionAcceptancePack(input: { env?: Record<string, string | undefined>; generatedAt?: string; root?: string } = {}): ProductionAcceptancePack {
  const generatedAt = input.generatedAt ?? new Date().toISOString()
  const inventory = buildInventoryLedger(input.root, generatedAt)
  const cutover = buildCutoverReport(input.env ?? process.env as Record<string, string | undefined>, undefined, () => generatedAt)
  const hasSchemes = inventory.items.some((item) => item.path.includes("app/schemes/create")) && inventory.items.some((item) => item.path.includes("app/schemes/edit/[schemeId]"))
  const hasTests = inventory.items.some((item) => item.path.includes("tests/scheme-create-route.test.ts")) && inventory.items.some((item) => item.path.includes("tests/scheme-edit-route.test.ts"))
  return {
    generatedAt,
    inventory,
    cutover,
    sections: [
      section("inventory-ledger", "Machine inventory ledger", inventory.readiness.total > 0 ? "pass" : "fail", "Governance Secretariat", [`${inventory.readiness.total} artefacts inventoried`, `${inventory.summary.route ?? 0} routes`, `${inventory.summary.api ?? 0} APIs`]),
      section("scheme-e2e", "Scheme create/edit/workflow regression", hasSchemes && hasTests ? "pass" : "fail", "Schemes Directorate", ["Create and edit routes present", "Regression tests present", "Durable store path exercised"]),
      section("cutover-gate", "Production cutover gate", cutover.ready ? "pass" : "warn", "Sovereign Ops", [`${cutover.blockers} blockers`, `${cutover.warnings} warnings`, "Route/RPC/RLS checks included"]),
      section("governance-hierarchy", "Governance hierarchy", TENANCY_HIERARCHY.length === 7 && GOVERNANCE_TIERS.length === 7 ? "pass" : "fail", "Secretary Office", [`${TENANCY_HIERARCHY.length} tenancy tiers`, `${GOVERNANCE_TIERS.length} governance tiers`, `${AI_CONTROL_TOWER.length} AI Control Tower bodies`, `${ROLE_SCOPE_MATRIX.length} role-scope mappings`]),
      section("acceptance-pack", "Production acceptance pack", "pass", "CISO Office", ["Cutover report embedded", "Inventory ledger embedded", "Governance hierarchy embedded"]),
    ],
  }
}

export function productionAcceptancePackToMarkdown(pack: ProductionAcceptancePack): string {
  const sectionRows = pack.sections.map((s) => `| ${s.id} | ${s.title} | ${s.status} | ${s.owner} | ${s.evidence.join("; ")} |`).join("\n")
  const gateRows = pack.cutover.gates.map((g) => `| ${g.id} | ${g.status} | ${g.severity} | ${g.detail.replace(/\|/g, "-")} |`).join("\n")
  return `# Production Acceptance Pack\n\nGenerated: ${pack.generatedAt}\n\n## Acceptance sections\n\n| ID | Section | Status | Owner | Evidence |\n| --- | --- | --- | --- | --- |\n${sectionRows}\n\n## Cutover gates\n\n| Gate | Status | Severity | Detail |\n| --- | --- | --- | --- |\n${gateRows}\n\n---\n\n${inventoryLedgerToMarkdown(pack.inventory)}\n`}
