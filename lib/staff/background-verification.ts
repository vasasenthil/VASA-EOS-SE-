// VASA-EOS(SE) — staff background verification (Module Catalogue v3.0 — School tier).
//
// No adult joins a school until cleared. POCSO 2012 and child-safeguarding norms make pre-appointment
// verification mandatory for anyone working with children: identity, qualification, police verification, POCSO
// antecedents and medical fitness. This tracks each candidate's checks and derives the overall verdict — a
// candidate is cleared to appoint ONLY when every mandatory check is cleared, and a single flagged check blocks
// appointment outright. Sample cohort seeded; real verifications persist behind getDb(). Pure + client-safe.

import { csvField } from "@/lib/csv"

export const VERIFICATION_CHECKS = [
  "Identity (Aadhaar)",
  "Qualification (TET / Degree)",
  "Police verification",
  "POCSO antecedents",
  "Medical fitness",
] as const

export type CheckStatus = "pending" | "cleared" | "flagged"
export type VerificationVerdict = "cleared" | "in-progress" | "flagged"

export interface StaffVerification {
  staffId: string
  name: string
  role: string
  /** One status per VERIFICATION_CHECKS entry. */
  checks: CheckStatus[]
}

export const STAFF_VERIFICATIONS: StaffVerification[] = [
  { staffId: "AP-2026-001", name: "Candidate A", role: "BT Assistant", checks: ["cleared", "cleared", "cleared", "cleared", "cleared"] },
  { staffId: "AP-2026-002", name: "Candidate B", role: "Secondary Grade Teacher", checks: ["cleared", "cleared", "pending", "cleared", "cleared"] },
  { staffId: "AP-2026-003", name: "Candidate C", role: "PG Assistant", checks: ["cleared", "cleared", "cleared", "flagged", "cleared"] },
  { staffId: "AP-2026-004", name: "Candidate D", role: "Physical Education Teacher", checks: ["cleared", "pending", "pending", "pending", "cleared"] },
  { staffId: "AP-2026-005", name: "Candidate E", role: "Special Educator", checks: ["cleared", "cleared", "cleared", "cleared", "pending"] },
  { staffId: "AP-2026-006", name: "Candidate F", role: "Non-teaching (Office)", checks: ["cleared", "cleared", "cleared", "cleared", "cleared"] },
  { staffId: "AP-2026-007", name: "Candidate G", role: "Cook (PM POSHAN)", checks: ["cleared", "cleared", "flagged", "pending", "cleared"] },
]

export function checkStatus(v: StaffVerification, check: string): CheckStatus | undefined {
  const i = (VERIFICATION_CHECKS as readonly string[]).indexOf(check)
  return i < 0 ? undefined : v.checks[i]
}

/** Overall verdict: flagged if any check is flagged; cleared only if all are cleared; else in-progress. */
export function verdict(v: StaffVerification): VerificationVerdict {
  if (v.checks.some((c) => c === "flagged")) return "flagged"
  if (v.checks.every((c) => c === "cleared")) return "cleared"
  return "in-progress"
}

/** A candidate may be appointed only on a clean, complete verification. */
export function clearedToAppoint(v: StaffVerification): boolean {
  return verdict(v) === "cleared"
}

export interface VerificationSummary {
  total: number
  cleared: number
  inProgress: number
  flagged: number
  /** Share cleared to appoint, 0–100. */
  clearanceRatePct: number
}

export function verificationSummary(items: StaffVerification[] = STAFF_VERIFICATIONS): VerificationSummary {
  const cleared = items.filter((v) => verdict(v) === "cleared").length
  return {
    total: items.length,
    cleared,
    inProgress: items.filter((v) => verdict(v) === "in-progress").length,
    flagged: items.filter((v) => verdict(v) === "flagged").length,
    clearanceRatePct: items.length === 0 ? 0 : Math.round((cleared / items.length) * 100),
  }
}


export function toCSV(items: StaffVerification[] = STAFF_VERIFICATIONS): string {
  const header = ["Staff ID", "Name", "Role", "Verdict", "Cleared to appoint"]
  const rows = items.map((v) => [v.staffId, v.name, v.role, verdict(v), clearedToAppoint(v) ? "yes" : "no"].map(csvField).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
