import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { csvField } from "@/lib/csv"
import { CATALOGUE_MODULES, CATALOGUE_TOTAL_MODULES } from "@/lib/governance/module-catalogue"
import { SECRETARY_CAPABILITIES } from "@/lib/governance/secretary-capabilities"
import { MINISTER_CAPABILITIES } from "@/lib/governance/minister-capabilities"
import { DIRECTOR_CAPABILITIES } from "@/lib/governance/director-capabilities"
import { PRINCIPAL_CAPABILITIES } from "@/lib/governance/principal-capabilities"

export type FunctionalBuildStatus = "fully-built" | "partial" | "yet-to-build"

export interface CanonicalFunctionalModule {
  id: string
  name: string
  layer: string
  domain: string
  owner: string
  referenceSource: string | null
  canonicalStatus: "implemented" | "scaffold" | "spec-only"
  status: FunctionalBuildStatus
}

export interface DeliveryCommitment {
  id: string
  name: string
  status: "fully-built" | "partial" | "externally-gated"
  evidence: string[]
  limitation: string
}

export interface FunctionalCoverageReport {
  generatedAt: string
  evidenceStandard: "canonical-module-definition-of-done"
  canonical: { declared: number; parsed: number; fullyBuilt: number; partial: number; yetToBuild: number; modules: CanonicalFunctionalModule[] }
  legacyCrosswalk: { attachmentDeclared: number; mapped: number; warning: string }
  roleCapabilities: { role: string; total: number; built: number; partial: number; pending: number }[]
  deliveryCommitments: DeliveryCommitment[]
  reconciliation: string[]
}

function unquote(value: string): string {
  const trimmed = value.trim()
  if (trimmed === "null") return ""
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed.slice(1, -1).replace(/\\"/g, '"')
  return trimmed
}

/** Parse the repository's generated, flat module YAML without adding a runtime YAML dependency. */
export function parseCanonicalModuleCatalogue(source: string): CanonicalFunctionalModule[] {
  const records: Record<string, string>[] = []
  let current: Record<string, string> | null = null
  for (const line of source.split(/\r?\n/)) {
    const start = line.match(/^\s{2}- id:\s*(.+)$/)
    if (start) { if (current) records.push(current); current = { id: unquote(start[1]) }; continue }
    if (!current) continue
    const field = line.match(/^\s{4}(name|layer|domain|owner|reference_source|status):\s*(.*)$/)
    if (field) current[field[1]] = unquote(field[2])
  }
  if (current) records.push(current)
  return records.map((record) => {
    const canonicalStatus = record.status as CanonicalFunctionalModule["canonicalStatus"]
    if (!record.id || !record.name || !["implemented", "scaffold", "spec-only"].includes(canonicalStatus)) throw new Error(`Invalid canonical module record: ${record.id || "unknown"}`)
    return {
      id: record.id, name: record.name, layer: record.layer, domain: record.domain, owner: record.owner,
      referenceSource: record.reference_source || null, canonicalStatus,
      status: canonicalStatus === "implemented" ? "fully-built" : canonicalStatus === "scaffold" ? "partial" : "yet-to-build",
    }
  })
}

const roleRow = (role: string, rows: { status: string }[]) => ({ role, total: rows.length, built: rows.filter((r) => r.status === "built").length, partial: rows.filter((r) => r.status === "partial").length, pending: rows.filter((r) => r.status === "pending").length })

export function buildFunctionalCoverageReport(root = process.cwd(), generatedAt = new Date().toISOString()): FunctionalCoverageReport {
  const cataloguePath = resolve(root, "modules/catalogue.yaml")
  if (!existsSync(cataloguePath)) throw new Error("Canonical module catalogue is missing")
  const modules = parseCanonicalModuleCatalogue(readFileSync(cataloguePath, "utf8"))
  const fullyBuilt = modules.filter((module) => module.status === "fully-built").length
  const partial = modules.filter((module) => module.status === "partial").length
  const yetToBuild = modules.filter((module) => module.status === "yet-to-build").length
  return {
    generatedAt,
    evidenceStandard: "canonical-module-definition-of-done",
    canonical: { declared: 391, parsed: modules.length, fullyBuilt, partial, yetToBuild, modules },
    legacyCrosswalk: { attachmentDeclared: CATALOGUE_TOTAL_MODULES, mapped: CATALOGUE_MODULES.length, warning: "Legacy attachment crosswalk is representative and must not be interpreted as full Definition-of-Done coverage." },
    roleCapabilities: [roleRow("Secretary", SECRETARY_CAPABILITIES), roleRow("Minister", MINISTER_CAPABILITIES), roleRow("Director", DIRECTOR_CAPABILITIES), roleRow("Principal / Headmaster", PRINCIPAL_CAPABILITIES)],
    deliveryCommitments: [
      { id: "secretary-command", name: "Secretary state command centre", status: "fully-built", evidence: ["app/secretary/dashboard/page.tsx", "lib/secretary/command-centre.ts"], limitation: "Production data freshness depends on live source adapters." },
      { id: "directorate-operations", name: "Seven-directorate operations centre", status: "partial", evidence: ["app/director/dashboard/page.tsx", "lib/director/operations-centre.ts"], limitation: "NFAE specialist coverage remains partial and state reference evidence is not synthetically apportioned." },
      { id: "principal-operations", name: "Principal / Headmaster school operations centre", status: "fully-built", evidence: ["app/(dashboards)/principal/dashboard/page.tsx", "lib/principal/operations-centre.ts"], limitation: "Requires authenticated school tenant assignment and live school stores." },
      { id: "district-operations", name: "CEO / DEO district operations centre", status: "partial", evidence: ["app/deo/dashboard/page.tsx", "lib/deo/district-operations.ts"], limitation: "Cross-process workflow records still require durable district tagging for strict workflow scoping." },
      { id: "policy-persistence", name: "Live policy drafting database", status: "externally-gated", evidence: ["lib/policy/schema.sql", "lib/policy/seed.sql", "app/api/production/policies/readiness/route.ts"], limitation: "Deployment must supply matching Supabase secrets and a PostgreSQL migration URI, apply migrations, and redeploy." },
      { id: "supabase-live", name: "Live Supabase platform connectivity", status: "externally-gated", evidence: ["lib/db/environment.ts", "lib/supabase/server.ts", "scripts/deploy/migrate.ts"], limitation: "Credentials, network reachability, schema application and key rotation are external operational controls; secrets are never committed." },
    ],
    reconciliation: [
      `Canonical CC-SPEC catalogue declares 391 modules; ${modules.length} were parsed and every ID is listed in this report.`,
      `The legacy attachment crosswalk declares ${CATALOGUE_TOTAL_MODULES} modules but maps ${CATALOGUE_MODULES.length}; its one-module headline variance against the canonical 391 remains a governance discrepancy requiring source-owner resolution.`,
      "Canonical status controls completeness: implemented = fully built, scaffold = partial, spec-only = yet to build. A route or TypeScript file alone does not override this status.",
      "Previous portal and database delivery requests are preserved as delivery commitments, with external and known implementation limitations stated explicitly.",
    ],
  }
}

export function functionalCoverageToCsv(report: FunctionalCoverageReport): string {
  const header = ["ID", "Name", "Layer", "Domain", "Owner", "Canonical status", "Build status", "Reference source"]
  const rows = report.canonical.modules.map((module) => [module.id, module.name, module.layer, module.domain, module.owner, module.canonicalStatus, module.status, module.referenceSource ?? ""].map(csvField).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}

export function functionalCoverageToMarkdown(report: FunctionalCoverageReport): string {
  const modules = report.canonical.modules.map((module) => `| ${module.id} | ${module.name.replace(/\|/g, "\\|")} | ${module.layer} | ${module.domain} | ${module.status} | ${module.referenceSource ? `\`${module.referenceSource}\`` : "—"} |`).join("\n")
  const commitments = report.deliveryCommitments.map((item) => `| ${item.name} | ${item.status} | ${item.evidence.map((path) => `\`${path}\``).join("<br>")} | ${item.limitation} |`).join("\n")
  return `# Complete Functional Module Coverage\n\nGenerated: ${report.generatedAt}\n\nEvidence standard: **${report.evidenceStandard}**.\n\n## Canonical summary\n\n| Declared | Parsed/listed | Fully built | Partial/scaffold | Yet to build/spec-only |\n| ---: | ---: | ---: | ---: | ---: |\n| ${report.canonical.declared} | ${report.canonical.parsed} | ${report.canonical.fullyBuilt} | ${report.canonical.partial} | ${report.canonical.yetToBuild} |\n\n## Reconciliation\n\n${report.reconciliation.map((line) => `- ${line}`).join("\n")}\n\n## Previous delivery commitments\n\n| Delivery | Status | Evidence | Limitation |\n| --- | --- | --- | --- |\n${commitments}\n\n## All canonical functional modules (no omitted IDs)\n\n| ID | Module | Layer | Domain | Status | Reference implementation |\n| --- | --- | --- | --- | --- | --- |\n${modules}\n`
}
