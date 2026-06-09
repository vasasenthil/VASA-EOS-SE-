// VASA-EOS(SE) — data retention & DPDP right-to-erasure schedule (Privacy / storage limitation).
//
// The DPDP Act 2023 requires storage limitation (keep personal data only as long as the
// purpose needs) and honours a data principal's right to erasure. This declares, per PII
// data class, the retention period, what triggers erasure, the erasure action (hard
// delete / anonymise / archive) and any statutory hold that lawfully delays a hard
// delete — plus the right-to-erasure (RTE) request lifecycle. It is derived from and
// self-verified against the PII catalogue: every rule maps to a catalogued class and
// every class has exactly one rule. Pure + client-safe.

import { PII_CATALOGUE, piiClassById } from "./pii-catalogue"

export type ErasureAction = "hard-delete" | "anonymise" | "archive"
export type RetentionTrigger =
  | "consent-withdrawn"
  | "purpose-fulfilled"
  | "statutory-period-elapsed"
  | "rte-request"

export interface RetentionRule {
  /** References a PiiClass id in the PII catalogue. */
  classId: string
  /** Machine retention period in days; null = lifecycle / statutory archival. */
  retentionDays: number | null
  erasureAction: ErasureAction
  triggers: RetentionTrigger[]
  /** Lawful reason a hard delete may be delayed (else "—"). */
  statutoryHold: string
}

export const RETENTION_RULES: RetentionRule[] = [
  { classId: "identity", retentionDays: null, erasureAction: "archive", triggers: ["purpose-fulfilled", "rte-request"], statutoryHold: "School record retained per Education Dept archival policy" },
  { classId: "aadhaar", retentionDays: 0, erasureAction: "hard-delete", triggers: ["purpose-fulfilled"], statutoryHold: "—" },
  { classId: "disability", retentionDays: null, erasureAction: "anonymise", triggers: ["consent-withdrawn", "rte-request"], statutoryHold: "Retained while enrolled for IEP continuity" },
  { classId: "health", retentionDays: null, erasureAction: "archive", triggers: ["statutory-period-elapsed", "rte-request"], statutoryHold: "Health record retention per RBSK / health policy" },
  { classId: "scheme", retentionDays: 2555, erasureAction: "anonymise", triggers: ["statutory-period-elapsed"], statutoryHold: "Financial audit window (7 years)" },
  { classId: "contact", retentionDays: null, erasureAction: "hard-delete", triggers: ["consent-withdrawn", "rte-request"], statutoryHold: "—" },
  { classId: "assessment", retentionDays: null, erasureAction: "archive", triggers: ["purpose-fulfilled"], statutoryHold: "Academic transcript retained for credentialing" },
  { classId: "attendance", retentionDays: 365, erasureAction: "anonymise", triggers: ["statutory-period-elapsed"], statutoryHold: "Aggregated analytics keeps de-identified data only" },
]

// The right-to-erasure request lifecycle (auditable at every stage).
export const RTE_LIFECYCLE: { stage: string; description: string }[] = [
  { stage: "received", description: "Erasure request logged against the data principal (APAAR)" },
  { stage: "identity-verified", description: "Requestor verified (principal or guardian for a minor)" },
  { stage: "assessed", description: "Statutory holds checked per data class; lawful scope determined" },
  { stage: "executed", description: "Hard-delete / anonymise / archive applied per the retention rule" },
  { stage: "confirmed", description: "Outcome recorded in the tamper-evident audit ledger and notified" },
]

export function ruleFor(classId: string): RetentionRule | undefined {
  return RETENTION_RULES.find((r) => r.classId === classId)
}

/** Rules whose classId does not resolve to a catalogued PII class (should be none). */
export function unknownClasses(): string[] {
  return RETENTION_RULES.filter((r) => !piiClassById(r.classId)).map((r) => r.classId)
}

/** Catalogued PII classes that have no retention rule (should be none). */
export function uncoveredClasses(): string[] {
  const ruled = new Set(RETENTION_RULES.map((r) => r.classId))
  return PII_CATALOGUE.filter((p) => !ruled.has(p.id)).map((p) => p.id)
}

export interface RetentionSummary {
  rules: number
  hardDelete: number
  anonymise: number
  archive: number
  honoursRte: number
}

export function retentionSummary(items: RetentionRule[] = RETENTION_RULES): RetentionSummary {
  return {
    rules: items.length,
    hardDelete: items.filter((r) => r.erasureAction === "hard-delete").length,
    anonymise: items.filter((r) => r.erasureAction === "anonymise").length,
    archive: items.filter((r) => r.erasureAction === "archive").length,
    honoursRte: items.filter((r) => r.triggers.includes("rte-request")).length,
  }
}

function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(items: RetentionRule[] = RETENTION_RULES): string {
  const header = ["Data class", "Retention", "Erasure action", "Triggers", "Statutory hold"]
  const rows = items.map((r) => {
    const klass = piiClassById(r.classId)
    const retention = r.retentionDays === null ? "Lifecycle / statutory" : r.retentionDays === 0 ? "Not stored" : `${r.retentionDays} days`
    return [klass?.dataClass ?? r.classId, retention, r.erasureAction, r.triggers.join("; "), r.statutoryHold].map(csvField).join(",")
  })
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
