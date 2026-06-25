// VASA-EOS(SE) — AI Control Tower + Seven Governance Tiers (the brief's AUTHORITY SPINE), honest.
//
// The Synthesis Brief (SYN-TN-001) names the State's instruments of authority above the twelve-layer
// architecture: an AI Control Tower of three permanent bodies, and seven governance tiers (G1..G7)
// that make every decision auditable and reversible. This is distinct from the seven MULTI-TENANCY
// tiers (T0..T6) which make every ACTION traceable — see lib/tenancy. The bodies themselves are
// institutional (a Cabinet, a CAG audit are not software); the platform's duty is to give each one
// AUDITABLE INSTRUMENTS. This self-verifying register maps each body/tier to the in-repo instrument
// that serves it, with an unbiased built/partial/pending status and a candid note.
//
// Honesty contract (tests/control-tower.test.ts): three Control-Tower bodies + seven G-tiers, present
// once each; a built/partial row cites a repoRef that exists on disk; a pending row cites nothing;
// the weighted coverage is a candid mid-range, never 100%. Out-of-scope sovereign-substrate controls
// (state-held keys/HSM, escrow, off-switch) are disclosed as pending aspects, never silently claimed.

import { csvField } from "@/lib/csv"
import { type CapabilityStatus } from "@/lib/governance/role-capabilities"

export type GovBodyStatus = CapabilityStatus // "built" | "partial" | "pending"
export type GovBodyKind = "control-tower" | "governance-tier"

export interface GovernanceBody {
  id: string
  kind: GovBodyKind
  name: string
  /** What this body is for. */
  mandate: string
  /** What it decides / the authority it holds. */
  authority: string
  status: GovBodyStatus
  /** Candid note: what the platform delivers for this body, and what it does not. */
  note: string
  /** In-repo instruments serving this body (each exists on disk for built/partial; empty for pending). */
  repoRefs: string[]
  /** Aspects honestly NOT delivered in this repo (may be empty). */
  pendingAspects: string[]
}

// ── AI Control Tower — three permanent bodies (not advisory committees) ──────────────────────────
const CONTROL_TOWER: GovernanceBody[] = [
  {
    id: "CT1",
    kind: "control-tower",
    name: "Sovereignty Console",
    mandate: "TN data residency, state-held keys, off-switch, source-code escrow, audit-log immutability.",
    authority: "Holds the State's ultimate technical sovereignty — the power to inspect, freeze and disable.",
    status: "partial",
    note:
      "App-level sovereignty instruments are built: a hash-chained tamper-evident audit ledger, DPDP consent/purpose-binding, and the sovereignty posture surface. The substrate controls — state-held keys/HSM, source-code escrow, a true off-switch — are organisational/infrastructure, out of scope for this repo, and remain pending by design.",
    repoRefs: ["app/governance/sovereignty/page.tsx", "lib/audit/trail.ts", "lib/consent/index.ts"],
    pendingAspects: ["State-held encryption keys / HSM custody", "Source-code escrow", "Sovereign off-switch"],
  },
  {
    id: "CT2",
    kind: "control-tower",
    name: "AI Ethics Board",
    mandate: "Continuous human authority over bias, fairness, explainability and model-card discipline.",
    authority: "Can require explanations, block unsafe outputs, and gate any high-stakes AI action behind human review.",
    status: "partial",
    note:
      "The instruments exist: every engine is deterministic and explainable, every agent runs behind confidence-gated guardrails and a human-in-the-loop approval queue, and the 8-pillar fabric carries Explainability and Safety. A standing model-card register and scheduled independent bias audits are partial.",
    repoRefs: ["app/governance/ai-guardrails/page.tsx", "lib/agents/guardrails.ts", "lib/ai/pillars.ts"],
    pendingAspects: ["Standing model-card register", "Scheduled independent bias / fairness audits"],
  },
  {
    id: "CT3",
    kind: "control-tower",
    name: "AI Leadership Council",
    mandate: "State AI policy, model governance, red-teaming, drift review, and RPwD · DPDP · IT Act compliance.",
    authority: "Sets State AI policy and model-governance standards the platform must conform to.",
    status: "partial",
    note:
      "The assurance register, threat model (red-team surface), the Evaluation-and-Drift pillar and the DPDP consent controls give the Council real instruments. Continuous live drift-monitoring of production models and a formal red-team cadence are partial — the LLM seam is advisory, not yet a governed production model.",
    repoRefs: ["lib/assurance/index.ts", "app/governance/threat-model/page.tsx", "lib/ai/pillars.ts"],
    pendingAspects: ["Continuous production-model drift monitoring", "Formal recurring red-team cadence"],
  },
]

// ── Seven Governance Tiers G1..G7 — every decision auditable and reversible ──────────────────────
const GOVERNANCE_TIERS: GovernanceBody[] = [
  {
    id: "G1",
    kind: "governance-tier",
    name: "State Cabinet",
    mandate: "Apex political authority — scheme policy, budget mandate and the platform's legitimacy.",
    authority: "Approves policy and budget; the platform serves it decision-ready briefings.",
    status: "partial",
    note:
      "The platform serves the Cabinet auditable instruments — cabinet notes and assembly briefings generated from live governance data. The Cabinet itself is an external institutional body; the platform's duty is the decision-ready surface, which is built.",
    repoRefs: ["app/governance/cabinet-note/page.tsx", "app/governance/assembly-briefing/page.tsx"],
    pendingAspects: [],
  },
  {
    id: "G2",
    kind: "governance-tier",
    name: "Empowered Committee (Chief Secretary)",
    mandate: "Cross-government empowerment — unblock inter-departmental decisions at the Chief Secretary's level.",
    authority: "Resolves cross-directorate and cross-department coordination that no single office can.",
    status: "partial",
    note:
      "The coordination surface and the governance framework give the Empowered Committee a shared operating picture. Formal empowered-decision workflows with binding cross-department routing are partial.",
    repoRefs: ["app/governance/coordination/page.tsx", "app/governance/framework/page.tsx"],
    pendingAspects: ["Binding cross-department empowered-decision workflow"],
  },
  {
    id: "G3",
    kind: "governance-tier",
    name: "Inter-Directorate Council",
    mandate: "Coordinate the seven directorates (DSE · DEE · DGE · DMS · DTERT · DPSE · DNFE) on shared data and policy.",
    authority: "Aligns directorate-level operations onto one data model — ending the seven-silo problem.",
    status: "built",
    note:
      "All seven directorates are modelled in the tenancy tree and surfaced; the directorates and org instruments give the Council a single, reconciled directorate view instead of seven incompatible spreadsheets.",
    repoRefs: ["app/governance/directorates/page.tsx", "lib/org/index.ts"],
    pendingAspects: [],
  },
  {
    id: "G4",
    kind: "governance-tier",
    name: "Programme Management Unit (PMU)",
    mandate: "Day-to-day programme execution oversight — delivery, readiness and operational health.",
    authority: "Owns delivery against commitments; escalates risks and tracks launch readiness.",
    status: "built",
    note:
      "The oversight surface and the honest launch-readiness scorecard give the PMU a live delivery picture with self-scored readiness and health/ready probes — not a midnight spreadsheet reconciliation.",
    repoRefs: ["app/governance/oversight/page.tsx", "lib/governance/launch-readiness.ts"],
    pendingAspects: [],
  },
  {
    id: "G5",
    kind: "governance-tier",
    name: "Tech Architecture Board",
    mandate: "Architecture governance — conformance of the twelve layers, modules and integrations to standard.",
    authority: "Ratifies architecture decisions; holds the self-verifying architecture and module registers.",
    status: "built",
    note:
      "The Board's instruments are the self-verifying twelve-layer architecture register and the module catalogue — every built/partial row cites on-disk evidence, so architecture conformance is auditable, not asserted.",
    repoRefs: ["lib/governance/architecture-layers.ts", "lib/governance/module-catalogue.ts"],
    pendingAspects: [],
  },
  {
    id: "G6",
    kind: "governance-tier",
    name: "Ethics · Equity · RPwD-21 Review",
    mandate: "Review every outcome for equity, social justice and full RPwD-2016 (21-category) accessibility.",
    authority: "Can flag inequitable or inaccessible outcomes and require remediation before scale.",
    status: "partial",
    note:
      "The equity surface and the per-criterion WCAG/accessibility conformance map give this tier real instruments; A/AA is met by automated audit. AAA criteria needing assistive-tech/manual verification and the full 21-category RPwD treatment across every flow remain audit-required / partial.",
    repoRefs: ["app/governance/equity/page.tsx", "lib/accessibility/conformance.ts"],
    pendingAspects: ["WCAG 2.1 AAA assistive-tech / manual verification", "Full RPwD-21 treatment across every flow"],
  },
  {
    id: "G7",
    kind: "governance-tier",
    name: "External Audit (CAG and independent)",
    mandate: "Independent external assurance — the State funds nothing it cannot audit.",
    authority: "Audits the platform's claims and finances independently of the operator.",
    status: "partial",
    note:
      "The platform PRODUCES the audit-ready evidence the assurance register tracks — self-tests/typecheck/lint/CI recorded as passed, with the independent audits a government must commission recorded honestly as not-started. The CAG/independent audit itself is external and is not claimed as done.",
    repoRefs: ["lib/assurance/index.ts"],
    pendingAspects: ["Commissioned CAG / independent external audit (not-started by design)"],
  },
]

export const GOVERNANCE_BODIES: GovernanceBody[] = [...CONTROL_TOWER, ...GOVERNANCE_TIERS]

export function byKind(kind: GovBodyKind, items: GovernanceBody[] = GOVERNANCE_BODIES): GovernanceBody[] {
  return items.filter((b) => b.kind === kind)
}

export function bodyById(id: string, items: GovernanceBody[] = GOVERNANCE_BODIES): GovernanceBody | undefined {
  return items.find((b) => b.id === id)
}

export function byBodyStatus(status: GovBodyStatus, items: GovernanceBody[] = GOVERNANCE_BODIES): GovernanceBody[] {
  return items.filter((b) => b.status === status)
}

export interface ControlTowerSummary {
  total: number
  controlTower: number
  governanceTiers: number
  built: number
  partial: number
  pending: number
  /** Honest weighted coverage: built = 1, partial = 0.5, pending = 0. */
  coveragePct: number
}

export function controlTowerSummary(items: GovernanceBody[] = GOVERNANCE_BODIES): ControlTowerSummary {
  const built = byBodyStatus("built", items).length
  const partial = byBodyStatus("partial", items).length
  const pending = byBodyStatus("pending", items).length
  const total = items.length
  const coveragePct = total === 0 ? 0 : Math.round(((built + partial * 0.5) / total) * 100)
  return {
    total,
    controlTower: byKind("control-tower", items).length,
    governanceTiers: byKind("governance-tier", items).length,
    built,
    partial,
    pending,
    coveragePct,
  }
}

export function toControlTowerCSV(items: GovernanceBody[] = GOVERNANCE_BODIES): string {
  const header = ["Id", "Kind", "Name", "Mandate", "Authority", "Status", "Note", "Instruments", "Pending aspects"]
  const rows = items.map((b) =>
    [b.id, b.kind, b.name, b.mandate, b.authority, b.status, b.note, b.repoRefs.join("; "), b.pendingAspects.join("; ")]
      .map(csvField)
      .join(","),
  )
  return [header.map(csvField).join(","), ...rows].join("\n")
}
