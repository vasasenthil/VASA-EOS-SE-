// VASA-EOS(SE) — DPDP consent ledger (InDEA 2.0 style).
// Every personal-data processing purpose requires explicit, withdrawable consent;
// under-18 consent is given by a guardian. Each grant/withdraw is written to the
// tamper-evident audit trail. In-memory mock store for demo; production persists.

import { appendAudit } from "@/lib/audit/trail"

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

const store: ConsentRecord[] = []
function id(): string {
  return `cns-${Math.random().toString(36).slice(2, 10)}`
}

function record(subjectApaar: string, purpose: ConsentPurpose, actor: string, status: "granted" | "withdrawn"): ConsentRecord {
  const rec: ConsentRecord = { id: id(), subjectApaar, purpose, actor, status, ts: new Date().toISOString() }
  store.push(rec)
  appendAudit({ actor, action: `consent.${status}`, resource: subjectApaar, details: { purpose } })
  return rec
}

export function grantConsent(input: { subjectApaar: string; purpose: ConsentPurpose; actor: string }): ConsentRecord {
  return record(input.subjectApaar, input.purpose, input.actor, "granted")
}

export function withdrawConsent(input: { subjectApaar: string; purpose: ConsentPurpose; actor: string }): ConsentRecord {
  return record(input.subjectApaar, input.purpose, input.actor, "withdrawn")
}

export function listConsents(subjectApaar?: string): ConsentRecord[] {
  return store.filter((r) => !subjectApaar || r.subjectApaar === subjectApaar)
}

/** Effective consent for a purpose — the most recent record wins. */
export function hasConsent(subjectApaar: string, purpose: ConsentPurpose): boolean {
  const recs = store.filter((r) => r.subjectApaar === subjectApaar && r.purpose === purpose)
  return recs[recs.length - 1]?.status === "granted"
}
