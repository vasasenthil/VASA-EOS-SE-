// VASA-EOS(SE) — PII data-classification catalogue (DPDP purpose-limitation backbone).
//
// Declares every personal-data class the platform handles, its sensitivity, the
// consent PURPOSE that must be on file to read it, the lawful basis (DPDP 2023), and
// where it is stored. This is the principled foundation for consent-gating: a getter
// looks up the gating purpose here, then enforces it via lib/consent/gate-server.
// Pure + client-safe.

import { csvField } from "@/lib/csv"

import type { ConsentPurpose } from "./index"

export type Sensitivity = "normal" | "sensitive" | "child"
export type LawfulBasis = "consent" | "guardian-consent" | "legitimate-use"

export interface PiiClass {
  id: string
  dataClass: string
  examples: string
  sensitivity: Sensitivity
  /** Consent purpose that gates reads of this class. */
  purpose: ConsentPurpose
  basis: LawfulBasis
  retention: string
  storedIn: string
}

export const PII_CATALOGUE: PiiClass[] = [
  { id: "identity", dataClass: "Student identity", examples: "Name, DOB, gender, APAAR/PEN", sensitivity: "child", purpose: "aadhaar_linkage", basis: "guardian-consent", retention: "Lifecycle + statutory archival", storedIn: "SIS / APAAR registry" },
  { id: "aadhaar", dataClass: "Aadhaar number", examples: "12-digit UID (verify-only)", sensitivity: "sensitive", purpose: "aadhaar_linkage", basis: "consent", retention: "Never stored (auth-only)", storedIn: "— (UIDAI verify)" },
  { id: "disability", dataClass: "Disability / CWSN", examples: "RPwD category, IEP, supports", sensitivity: "sensitive", purpose: "health_federation", basis: "guardian-consent", retention: "Lifecycle (inclusion cell)", storedIn: "cwsn_students" },
  { id: "health", dataClass: "Health screening (RBSK)", examples: "Screening, referral, immunisation", sensitivity: "sensitive", purpose: "health_federation", basis: "guardian-consent", retention: "Per health-record policy", storedIn: "RBSK module" },
  { id: "scheme", dataClass: "Scheme beneficiary (DBT)", examples: "Scheme, amount, bank ref", sensitivity: "normal", purpose: "scheme_eligibility", basis: "legitimate-use", retention: "Disbursement + audit window", storedIn: "scholarships / distribution" },
  { id: "contact", dataClass: "Guardian contact", examples: "Parent phone / email", sensitivity: "normal", purpose: "communications", basis: "consent", retention: "Until withdrawn", storedIn: "SIS / comms" },
  { id: "assessment", dataClass: "Assessment & progress", examples: "Scores, HPC, diagnostics", sensitivity: "child", purpose: "analytics", basis: "legitimate-use", retention: "Academic lifecycle", storedIn: "HPC / diagnostic / results" },
  { id: "attendance", dataClass: "Attendance & biometrics", examples: "Daily attendance, any biometric", sensitivity: "sensitive", purpose: "analytics", basis: "legitimate-use", retention: "Term + analytics window", storedIn: "attendance / staff-attendance" },
]

export function piiClassById(id: string): PiiClass | undefined {
  return PII_CATALOGUE.find((p) => p.id === id)
}

/** The consent purpose that gates a data class — the lookup a getter uses. */
export function gatingPurpose(id: string): ConsentPurpose | undefined {
  return piiClassById(id)?.purpose
}

export function byPurpose(purpose: ConsentPurpose): PiiClass[] {
  return PII_CATALOGUE.filter((p) => p.purpose === purpose)
}

export interface PiiSummary {
  classes: number
  sensitive: number
  child: number
  consentGated: number
}

export function piiSummary(items: PiiClass[] = PII_CATALOGUE): PiiSummary {
  return {
    classes: items.length,
    sensitive: items.filter((p) => p.sensitivity === "sensitive").length,
    child: items.filter((p) => p.sensitivity === "child").length,
    consentGated: items.filter((p) => p.basis === "consent" || p.basis === "guardian-consent").length,
  }
}


export function toCSV(items: PiiClass[] = PII_CATALOGUE): string {
  const header = ["Data class", "Examples", "Sensitivity", "Gating purpose", "Lawful basis", "Retention", "Stored in"]
  const rows = items.map((p) =>
    [p.dataClass, p.examples, p.sensitivity, p.purpose, p.basis, p.retention, p.storedIn].map(csvField).join(","),
  )
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
