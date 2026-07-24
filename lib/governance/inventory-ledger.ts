import { existsSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"

export type InventoryStatus = "built" | "partial" | "gated"

export interface InventoryItem {
  id: string
  kind: "route" | "api" | "module" | "test" | "migration" | "policy" | "platform-module" | "document"
  path: string
  status: InventoryStatus
  owner: string
  dataClassification: "public" | "internal" | "confidential" | "sensitive"
  tenantScoped: boolean
  notes: string
}

export interface InventoryLedger {
  generatedAt: string
  summary: Record<InventoryItem["kind"], number>
  readiness: { built: number; partial: number; gated: number; total: number }
  items: InventoryItem[]
}

const DEFAULT_ROOT = process.cwd()
const WALK_EXCLUDES = new Set(["node_modules", ".git", ".next", "coverage", "dist", "out"])
const API_ROUTE_RE = /(^|\/)app\/api\/.+\/route\.(ts|tsx)$/
const PAGE_ROUTE_RE = /(^|\/)app\/.+\/page\.(ts|tsx)$/
const TEST_RE = /(^|\/)tests\/.+\.test\.ts$/
const SQL_RE = /(^|\/)scripts\/\d+-.+\.sql$/
const REGO_RE = /(^|\/)policies\/.+\.rego$/
const GO_MOD_RE = /(^|\/)platform\/.+\/go\.mod$/
const DOC_RE = /(^|\/)docs\/.+\.md$/

function walk(root: string, dir = root, out: string[] = []): string[] {
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir)) {
    if (WALK_EXCLUDES.has(entry)) continue
    const abs = join(dir, entry)
    const st = statSync(abs)
    if (st.isDirectory()) walk(root, abs, out)
    else out.push(relative(root, abs).replace(/\\/g, "/"))
  }
  return out
}

function idFor(kind: InventoryItem["kind"], path: string): string {
  return `${kind}:${path.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase()}`
}

function ownerFor(path: string): string {
  if (path.includes("governance")) return "Governance Secretariat"
  if (path.includes("scheme")) return "Schemes Directorate"
  if (path.includes("integration") || path.includes("phase6")) return "Integration Cell"
  if (path.includes("ml") || path.includes("ai")) return "AI Control Tower"
  if (path.includes("worker") || path.includes("events") || path.includes("outbox")) return "Platform Operations"
  if (path.includes("production") || path.includes("infra") || path.includes("deploy")) return "Sovereign Ops"
  if (path.includes("auth") || path.includes("security") || path.includes("audit")) return "CISO Office"
  return "Module Owner"
}

function classificationFor(path: string): InventoryItem["dataClassification"] {
  if (/student|attendance|health|scholarship|tc|admission|fees|cwsn|dpdp|consent/i.test(path)) return "sensitive"
  if (/audit|security|auth|governance|production|cutover|source-escrow/i.test(path)) return "confidential"
  if (/public|docs|manifest|offline/i.test(path)) return "public"
  return "internal"
}

function tenantScoped(path: string): boolean {
  return /store|route|page|migration|rls|tenant|workflow|scheme|scholarship|tc|attendance|student|school|district|block/i.test(path)
}

function statusFor(kind: InventoryItem["kind"], path: string): InventoryStatus {
  if (/(^|\/|-)live(\/|-)|hsm|vault|kms|gpu|triton|vllm|keycloak|sdc/i.test(path)) return "gated"
  if (kind === "document" || kind === "test" || kind === "migration" || kind === "policy") return "built"
  if (/demo|mock|seed|partial/i.test(path)) return "partial"
  return "built"
}

function item(kind: InventoryItem["kind"], path: string): InventoryItem {
  return {
    id: idFor(kind, path),
    kind,
    path,
    status: statusFor(kind, path),
    owner: ownerFor(path),
    dataClassification: classificationFor(path),
    tenantScoped: tenantScoped(path),
    notes: "Auto-inventoried for governance acceptance and cutover evidence.",
  }
}

export function buildInventoryLedger(root = DEFAULT_ROOT, generatedAt = new Date().toISOString()): InventoryLedger {
  const files = walk(root)
  const libModules = existsSync(join(root, "lib"))
    ? readdirSync(join(root, "lib")).filter((name) => statSync(join(root, "lib", name)).isDirectory()).map((name) => `lib/${name}`)
    : []
  const items: InventoryItem[] = [
    ...files.filter((path) => PAGE_ROUTE_RE.test(path)).map((path) => item("route", path)),
    ...files.filter((path) => API_ROUTE_RE.test(path)).map((path) => item("api", path)),
    ...libModules.map((path) => item("module", path)),
    ...files.filter((path) => TEST_RE.test(path)).map((path) => item("test", path)),
    ...files.filter((path) => SQL_RE.test(path)).map((path) => item("migration", path)),
    ...files.filter((path) => REGO_RE.test(path)).map((path) => item("policy", path)),
    ...files.filter((path) => GO_MOD_RE.test(path)).map((path) => item("platform-module", path.replace(/\/go\.mod$/, ""))),
    ...files.filter((path) => DOC_RE.test(path)).map((path) => item("document", path)),
  ].sort((a, b) => `${a.kind}:${a.path}`.localeCompare(`${b.kind}:${b.path}`))
  const summary = items.reduce((acc, cur) => ({ ...acc, [cur.kind]: (acc[cur.kind] ?? 0) + 1 }), {} as Record<InventoryItem["kind"], number>)
  const readiness = items.reduce((acc, cur) => ({ ...acc, [cur.status]: acc[cur.status] + 1, total: acc.total + 1 }), { built: 0, partial: 0, gated: 0, total: 0 })
  return { generatedAt, summary, readiness, items }
}

export function inventoryLedgerToMarkdown(ledger: InventoryLedger): string {
  const summaryRows = Object.entries(ledger.summary).sort(([a], [b]) => a.localeCompare(b)).map(([kind, count]) => `| ${kind} | ${count} |`).join("\n")
  const criticalRows = ledger.items
    .filter((item) => ["api", "route", "module", "migration", "platform-module"].includes(item.kind))
    .slice(0, 250)
    .map((item) => `| ${item.kind} | \`${item.path}\` | ${item.status} | ${item.owner} | ${item.dataClassification} | ${item.tenantScoped ? "yes" : "no"} |`)
    .join("\n")
  return `# Governance Inventory Ledger\n\nGenerated: ${ledger.generatedAt}\n\n## Summary\n\n| Kind | Count |\n| --- | ---: |\n${summaryRows}\n\n## Readiness\n\n| Built | Partial | Gated | Total |\n| ---: | ---: | ---: | ---: |\n| ${ledger.readiness.built} | ${ledger.readiness.partial} | ${ledger.readiness.gated} | ${ledger.readiness.total} |\n\n## Critical inventory sample\n\n| Kind | Path | Status | Owner | Data | Tenant scoped |\n| --- | --- | --- | --- | --- | --- |\n${criticalRows}\n`
}
