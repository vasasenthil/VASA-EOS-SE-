// VASA-EOS(SE) — Data Protection Impact Assessment (DPIA) scaffold generator.
//
// The DPDP Act 2023 expects a Significant Data Fiduciary handling children's data at
// state scale to conduct a DPIA before go-live. Rather than a static document that
// drifts from the code, this DERIVES a DPIA scaffold from the live PII catalogue
// (lib/consent/pii-catalogue): every catalogued data class becomes a processing
// activity with an inherent-risk rating and recommended safeguards. The output is a
// drafting aid for the Data Protection Officer to complete and sign — not a substitute
// for the human assessment (the assurance register keeps the DPIA honestly "in-progress").
// Pure + client-safe.

import { PII_CATALOGUE, type PiiClass, type Sensitivity, type LawfulBasis } from "./pii-catalogue"

export type RiskRating = "low" | "medium" | "high"

export interface DpiaActivity {
  /** PII class id this activity assesses. */
  id: string
  dataClass: string
  examples: string
  sensitivity: Sensitivity
  basis: LawfulBasis
  purpose: string
  retention: string
  storedIn: string
  /** Inherent risk before the platform safeguards are applied. */
  inherentRisk: RiskRating
  /** Concrete safeguards the platform already provides for this class. */
  safeguards: string[]
}

const SENSITIVITY_RISK: Record<Sensitivity, RiskRating> = {
  normal: "low",
  child: "high", // children's data is high-risk under DPDP regardless of class
  sensitive: "high",
}

function escalate(r: RiskRating, basis: LawfulBasis): RiskRating {
  // legitimate-use processing without explicit consent raises low to medium.
  if (basis === "legitimate-use" && r === "low") return "medium"
  return r
}

function safeguardsFor(p: PiiClass): string[] {
  const base = [
    "Consent-gated read (lib/consent/gate-server.gatePiiClass) — fail-closed",
    "Tamper-evident audit of every read decision (lib/audit)",
    "Per-role data scoping (ReBAC) + RLS-per-tenant defense-in-depth",
  ]
  if (p.sensitivity === "child" || p.basis === "guardian-consent") {
    base.push("Guardian consent for under-18 (DPDP children's-data protection)")
  }
  if (p.sensitivity === "sensitive") {
    base.push("Encryption at rest + minimised projection (data-minimisation)")
  }
  if (p.id === "aadhaar") {
    base.push("Verify-only — Aadhaar number never stored (UIDAI compliance)")
  }
  return base
}

/** Derive one DPIA processing activity from a catalogued PII class. */
export function activityFor(p: PiiClass): DpiaActivity {
  const inherentRisk = escalate(SENSITIVITY_RISK[p.sensitivity], p.basis)
  return {
    id: p.id,
    dataClass: p.dataClass,
    examples: p.examples,
    sensitivity: p.sensitivity,
    basis: p.basis,
    purpose: p.purpose,
    retention: p.retention,
    storedIn: p.storedIn,
    inherentRisk,
    safeguards: safeguardsFor(p),
  }
}

export interface DpiaDocument {
  title: string
  regulation: string
  /** This is a generated scaffold, NOT a signed assessment. */
  status: "scaffold"
  scope: string
  generatedFrom: string
  activities: DpiaActivity[]
  /** Steps the DPO must complete to turn the scaffold into a signed DPIA. */
  dpoActions: string[]
}

export function generateDpia(catalogue: PiiClass[] = PII_CATALOGUE): DpiaDocument {
  return {
    title: "VASA-EOS(SE) — Data Protection Impact Assessment (scaffold)",
    regulation: "Digital Personal Data Protection Act, 2023 (India)",
    status: "scaffold",
    scope:
      "Processing of school-education personal data for Tamil Nadu (≈1.27 crore students). " +
      "Generated from the live PII data-classification catalogue.",
    generatedFrom: "lib/consent/pii-catalogue.ts",
    activities: catalogue.map(activityFor),
    dpoActions: [
      "Validate each processing activity, lawful basis and retention with the data owner",
      "Confirm necessity & proportionality of each data class against its stated purpose",
      "Assess residual risk after the listed safeguards and record the rating",
      "Document data-subject rights handling (access, correction, erasure, grievance)",
      "Define the cross-border / processor (sub-fiduciary) position",
      "Obtain Data Protection Officer review and sign-off before go-live",
    ],
  }
}

export interface DpiaSummary {
  activities: number
  high: number
  medium: number
  low: number
  childDataActivities: number
}

export function dpiaSummary(doc: DpiaDocument = generateDpia()): DpiaSummary {
  const a = doc.activities
  return {
    activities: a.length,
    high: a.filter((x) => x.inherentRisk === "high").length,
    medium: a.filter((x) => x.inherentRisk === "medium").length,
    low: a.filter((x) => x.inherentRisk === "low").length,
    childDataActivities: a.filter((x) => x.sensitivity === "child").length,
  }
}

/** Render the scaffold as a Markdown document the DPO can complete and circulate. */
export function toMarkdown(doc: DpiaDocument = generateDpia()): string {
  const s = dpiaSummary(doc)
  const lines: string[] = []
  lines.push(`# ${doc.title}`, "")
  lines.push(`**Regulation:** ${doc.regulation}  `)
  lines.push(`**Status:** ${doc.status} (auto-generated — requires DPO completion & sign-off)  `)
  lines.push(`**Generated from:** \`${doc.generatedFrom}\``, "")
  lines.push(`**Scope:** ${doc.scope}`, "")
  lines.push(`**Risk profile:** ${s.activities} processing activities — ${s.high} high, ${s.medium} medium, ${s.low} low; ${s.childDataActivities} involve children's data.`, "")
  lines.push("## Processing activities", "")
  for (const a of doc.activities) {
    lines.push(`### ${a.dataClass} — inherent risk: ${a.inherentRisk.toUpperCase()}`)
    lines.push(`- **Examples:** ${a.examples}`)
    lines.push(`- **Sensitivity / basis:** ${a.sensitivity} / ${a.basis}`)
    lines.push(`- **Purpose:** ${a.purpose}`)
    lines.push(`- **Retention:** ${a.retention}`)
    lines.push(`- **Stored in:** ${a.storedIn}`)
    lines.push(`- **Safeguards:**`)
    for (const g of a.safeguards) lines.push(`  - ${g}`)
    lines.push("")
  }
  lines.push("## DPO actions to finalise", "")
  for (const action of doc.dpoActions) lines.push(`- [ ] ${action}`)
  lines.push("")
  return lines.join("\n")
}
