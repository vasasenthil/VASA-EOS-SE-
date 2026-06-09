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

/**
 * Effective consent for a (subject, purpose) over a record list — most recent wins.
 * Pure and fail-closed: no record => not granted. The PII-read enforcement seam
 * (lib/consent/gate-server) delegates here so the rule is unit-testable.
 */
export function consentGranted(
  records: ConsentRecord[],
  subjectApaar: string,
  purpose: ConsentPurpose,
): boolean {
  const matching = records
    .filter((r) => r.subjectApaar === subjectApaar && r.purpose === purpose)
    .sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0))
  return matching[matching.length - 1]?.status === "granted"
}
