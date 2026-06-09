// VASA-EOS(SE) — unified Compliance & Standards index (leadership posture view).
//
// One place that aggregates every self-verifying register the platform exposes —
// architecture conformance, NDEAR, STRIDE threat model, AI guardrails, DPIA, PII
// catalogue, assurance, RPwD, languages, channels/IVR, data lineage and the DR runbook
// — with an objective item count and an honest headline drawn from each register's own
// summary. No fabricated composite score: it surfaces the real numbers. Each domain
// names the register module and its inspection page; a test asserts both exist on disk,
// so this index can never point at a register or page that isn't there. Pure (composes
// other pure modules) + client-safe.

import { archSummary } from "@/lib/architecture"
import { ndearSummary } from "@/lib/compliance/ndear"
import { threatSummary } from "@/lib/security/threat-model"
import { guardrailSummary } from "@/lib/agents/guardrails"
import { dpiaSummary } from "@/lib/consent/dpia"
import { piiSummary } from "@/lib/consent/pii-catalogue"
import { retentionSummary } from "@/lib/consent/retention"
import { assuranceSummary } from "@/lib/assurance"
import { rpwdSummary } from "@/lib/accessibility/rpwd"
import { languageSummary } from "@/lib/i18n/languages"
import { channelSummary } from "@/lib/accessibility/channels"
import { lineageSummary } from "@/lib/data/lineage"
import { standardsSummary } from "@/lib/data/standards"
import { matrixSummary } from "@/lib/access/matrix"
import { runbookSummary } from "@/lib/ops-posture/runbook"

export interface ComplianceDomain {
  id: string
  name: string
  /** Architecture pillar this evidences. */
  pillar: string
  /** Register module path (asserted to exist). */
  registerRef: string
  /** In-app inspection route (its page file is asserted to exist). */
  route: string
  /** Objective count of evidence items in the register. */
  items: number
  /** Honest one-line status drawn from the register's own summary. */
  headline: string
}

export function complianceDomains(): ComplianceDomain[] {
  const arch = archSummary()
  const ndear = ndearSummary()
  const threat = threatSummary()
  const guard = guardrailSummary()
  const dpia = dpiaSummary()
  const pii = piiSummary()
  const retention = retentionSummary()
  const assurance = assuranceSummary()
  const rpwd = rpwdSummary()
  const lang = languageSummary()
  const chan = channelSummary()
  const lineage = lineageSummary()
  const standards = standardsSummary()
  const matrix = matrixSummary()
  const runbook = runbookSummary()

  return [
    { id: "architecture", name: "Architecture conformance", pillar: "All pillars", registerRef: "lib/architecture/index.ts", route: "/architecture", items: arch.components, headline: `${arch.implemented} implemented · ${arch.partial} partial across ${arch.pillars} pillars` },
    { id: "ndear", name: "NDEAR compliance", pillar: "Integration", registerRef: "lib/compliance/ndear.ts", route: "/governance/ndear", items: ndear.total, headline: `${ndear.implemented} implemented · ${ndear.partial} partial · ${ndear.coveragePct}% coverage` },
    { id: "threat-model", name: "STRIDE threat model", pillar: "Security", registerRef: "lib/security/threat-model.ts", route: "/governance/threat-model", items: threat.threats, headline: `${threat.mitigated} mitigated · ${threat.partial} partial · ${threat.categories}/6 STRIDE` },
    { id: "access-matrix", name: "Role × permission matrix", pillar: "Security", registerRef: "lib/access/matrix.ts", route: "/governance/access-matrix", items: matrix.roles, headline: `${matrix.roles} roles · ${matrix.actions} actions · ${matrix.elevatedActions} elevated (CABAC)` },
    { id: "ai-guardrails", name: "Responsible-AI guardrails", pillar: "Native-AI", registerRef: "lib/agents/guardrails.ts", route: "/governance/ai-guardrails", items: guard.guardrails, headline: `${guard.enforced} enforced · ${guard.partial} partial · ${guard.risksCovered} risks covered` },
    { id: "dpia", name: "DPIA (scaffold)", pillar: "Security", registerRef: "lib/consent/dpia.ts", route: "/governance/dpia", items: dpia.activities, headline: `${dpia.high} high-risk · ${dpia.childDataActivities} children's-data activities` },
    { id: "pii", name: "PII data classification", pillar: "Security", registerRef: "lib/consent/pii-catalogue.ts", route: "/governance/pii-catalogue", items: pii.classes, headline: `${pii.sensitive} sensitive · ${pii.child} children's · ${pii.consentGated} consent-gated` },
    { id: "retention", name: "Retention & right-to-erasure", pillar: "Security", registerRef: "lib/consent/retention.ts", route: "/governance/retention", items: retention.rules, headline: `${retention.hardDelete} hard-delete · ${retention.anonymise} anonymise · ${retention.honoursRte} honour RTE` },
    { id: "assurance", name: "Independent assurance", pillar: "Operations", registerRef: "lib/assurance/index.ts", route: "/governance/assurance", items: assurance.total, headline: `${assurance.passed} passed · ${assurance.inProgress} in-progress · ${assurance.notStarted} not-started` },
    { id: "rpwd", name: "RPwD 21 disabilities", pillar: "Accessibility", registerRef: "lib/accessibility/rpwd.ts", route: "/accessibility/rpwd", items: rpwd.total, headline: `${rpwd.groups} statutory groups · ${rpwd.benchmarkEligible} benchmark-eligible` },
    { id: "languages", name: "22-language catalogue", pillar: "Accessibility", registerRef: "lib/i18n/languages.ts", route: "/accessibility/languages", items: lang.total, headline: `${lang.scheduled} scheduled · ${lang.scripts} scripts` },
    { id: "channels", name: "Multi-channel & IVR", pillar: "Accessibility", registerRef: "lib/accessibility/channels.ts", route: "/accessibility/channels", items: chan.channels, headline: `${chan.ivrFlows} IVR flows · ${chan.noLiteracyChannels} no-literacy channels` },
    { id: "data-lineage", name: "Medallion data lineage", pillar: "Data", registerRef: "lib/data/lineage.ts", route: "/data-lineage", items: lineage.datasets, headline: `${lineage.bronze}/${lineage.silver}/${lineage.gold} bronze/silver/gold · ${lineage.piiDatasets} PII` },
    { id: "data-standards", name: "Master-data & ID standards", pillar: "Data", registerRef: "lib/data/standards.ts", route: "/data-standards", items: standards.standards, headline: `${standards.standards} identifier standards · ${standards.authorities} authorities` },
    { id: "dr-runbook", name: "DR runbook & on-call", pillar: "Operations", registerRef: "lib/ops-posture/runbook.ts", route: "/ops/runbook", items: runbook.runbooks, headline: `${runbook.drScenariosCovered} DR scenarios · ${runbook.onCallRoles} on-call roles` },
  ]
}

export interface ComplianceIndexSummary {
  domains: number
  /** Total evidence items across all registers. */
  evidenceItems: number
  pillars: number
}

export function complianceIndexSummary(): ComplianceIndexSummary {
  const domains = complianceDomains()
  return {
    domains: domains.length,
    evidenceItems: domains.reduce((n, d) => n + d.items, 0),
    pillars: new Set(domains.map((d) => d.pillar)).size,
  }
}

function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(domains: ComplianceDomain[] = complianceDomains()): string {
  const header = ["Domain", "Pillar", "Items", "Status", "Register", "Route"]
  const rows = domains.map((d) =>
    [d.name, d.pillar, String(d.items), d.headline, d.registerRef, d.route].map(csvField).join(","),
  )
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
