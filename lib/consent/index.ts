// VASA-EOS(SE) — DPDP consent ledger (InDEA 2.0 style) — client-safe core.
// Purposes and types for explicit, withdrawable consent (under-18 consent is given
// by a guardian). DB-backed persistence (audit-logged) lives in ./store (server-only).

export type ConsentPurpose =
  | "aadhaar_linkage"
  | "health_federation"
  | "scheme_eligibility"
  | "analytics"
  | "communications"

export const CONSENT_PURPOSES: { key: ConsentPurpose; label: string }[] = [
  { key: "aadhaar_linkage", label: "Aadhaar linkage (verify-only, never stored)" },
  { key: "health_federation", label: "Health record federation (ABHA / RBSK)" },
  { key: "scheme_eligibility", label: "Scheme eligibility & DBT" },
  { key: "analytics", label: "Anonymised analytics" },
  { key: "communications", label: "Multi-channel communications" },
]

export interface ConsentRecord {
  id: string
  subjectApaar: string
  purpose: ConsentPurpose
  /** Guardian for under-18 (DPDP children's-data protection). */
  actor: string
  status: "granted" | "withdrawn"
  ts: string
}
