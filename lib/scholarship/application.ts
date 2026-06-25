// VASA-EOS(SE) — Scholarship / benefit application form + eligibility (Schemes & Welfare).
//
// A welfare benefit application is rule-governed, not a free text box: a scheme, social
// category, annual income, attendance, and a DBT bank account. Eligibility is derived by the
// Reasoning engine (policy-as-code), so the rule that admitted or rejected an applicant is
// explainable and auditable. Pure + client-safe; the server action files it into the
// SCHOLARSHIP_SANCTION workflow (Headmaster verify → BEO sanction → DEO scrutiny ≥ ₹25k →
// DBT release).

import { reason, type Rule, type FactValue } from "@/lib/ai/engines"

export const SCHOLARSHIP_SCHEMES = [
  "Pudhumai Penn",
  "BC/MBC Scholarship",
  "SC/ST Scholarship",
  "Free Bicycle Scheme",
  "Merit Scholarship",
  "Other",
] as const

export const SOCIAL_CATEGORIES = ["SC", "ST", "BC", "MBC", "EWS", "General"] as const

/** Reserved categories with a relaxed income ceiling for most welfare schemes. */
const RESERVED = new Set(["SC", "ST", "BC", "MBC", "EWS"])
/** Income ceiling (₹/year) for need-based eligibility. */
export const INCOME_CEILING = 250000
/** Minimum attendance (%) for benefit continuance. */
export const MIN_ATTENDANCE = 75

export interface ScholarshipForm {
  studentName: string
  scheme: string
  category: string
  annualIncome: number
  attendancePct: number
  /** Beneficiary DBT account (last digits shown; full value never logged). */
  bankAccount: string
  amount: number
  declaration: boolean
}

export function emptyScholarship(): ScholarshipForm {
  return { studentName: "", scheme: "", category: "", annualIncome: 0, attendancePct: 0, bankAccount: "", amount: 0, declaration: false }
}

export type FieldErrors = Partial<Record<keyof ScholarshipForm, string>>

export function validateScholarship(f: ScholarshipForm): { ok: boolean; errors: FieldErrors } {
  const e: FieldErrors = {}
  if (!f.studentName.trim()) e.studentName = "Student name is required"
  if (!(SCHOLARSHIP_SCHEMES as readonly string[]).includes(f.scheme)) e.scheme = "Select a scheme"
  if (!(SOCIAL_CATEGORIES as readonly string[]).includes(f.category)) e.category = "Select a category"
  if (!Number.isFinite(f.annualIncome) || f.annualIncome < 0) e.annualIncome = "Enter a valid annual income"
  if (!Number.isFinite(f.attendancePct) || f.attendancePct < 0 || f.attendancePct > 100) e.attendancePct = "Attendance must be 0–100%"
  if (!/^\d{9,18}$/.test(f.bankAccount.trim())) e.bankAccount = "Enter a valid bank account number (9–18 digits)"
  if (!Number.isFinite(f.amount) || f.amount <= 0) e.amount = "Enter the benefit amount"
  if (!f.declaration) e.declaration = "You must certify the particulars are true"
  return { ok: Object.keys(e).length === 0, errors: e }
}

export interface Eligibility {
  eligible: boolean
  reasons: string[]
}

/** Eligibility rules, evaluated by the Reasoning engine so the verdict is explainable. */
export function eligibilityRules(): Rule[] {
  return [
    { id: "income", when: [{ key: "incomeOk", op: "eq", value: true }], then: "Income within ceiling", because: `Annual income ≤ ₹${INCOME_CEILING.toLocaleString("en-IN")}` },
    { id: "category", when: [{ key: "reserved", op: "eq", value: true }], then: "Reserved-category benefit", because: "Belongs to a reserved social category" },
    { id: "attendance", when: [{ key: "attendanceOk", op: "eq", value: true }], then: "Attendance norm met", because: `Attendance ≥ ${MIN_ATTENDANCE}%` },
  ]
}

/** Derive eligibility from the form via the Reasoning engine (advisory; a human sanctions). */
export function deriveEligibility(f: ScholarshipForm): Eligibility {
  const facts: Record<string, FactValue> = {
    incomeOk: f.annualIncome <= INCOME_CEILING,
    reserved: RESERVED.has(f.category),
    attendanceOk: f.attendancePct >= MIN_ATTENDANCE,
  }
  const r = reason({ facts, rules: eligibilityRules() })
  const met = new Set(r.conclusions.map((c) => c.ruleId))
  // Need-based: income ceiling AND attendance; reserved category waives the income test.
  const eligible = (met.has("income") || met.has("category")) && met.has("attendance")
  const reasons = r.conclusions.map((c) => c.because)
  if (!met.has("attendance")) reasons.push(`Attendance below ${MIN_ATTENDANCE}% — benefit on hold`)
  if (!met.has("income") && !met.has("category")) reasons.push("Income above ceiling and not a reserved category")
  return { eligible, reasons }
}

export function maskAccount(acc: string): string {
  const a = acc.trim()
  return a.length <= 4 ? a : `••••${a.slice(-4)}`
}
