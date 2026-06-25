// VASA-EOS(SE) — RBSK child-health referral form + triage (Health, Safety & Welfare).
//
// Rashtriya Bal Swasthya Karyakaram screens for the "4 Ds" — Defects at birth, Deficiencies,
// Diseases, Developmental delays. A screening that needs more than block-level care is referred
// to the District Early-Intervention Centre (DEIC). This is the rich form + triage rule that
// decides specialist referral (severe, or a referral-warranting category), plus DPDP-consented
// guardian contact. Pure + client-safe; the action files it into the HEALTH_REFERRAL workflow.

export const RBSK_CATEGORIES = [
  "Defects at birth",
  "Deficiencies",
  "Diseases",
  "Developmental delays",
  "Disability",
] as const

export const SEVERITY_LEVELS = ["mild", "moderate", "severe"] as const
export type Severity = (typeof SEVERITY_LEVELS)[number]

/** Categories that warrant a specialist (DEIC) referral irrespective of severity. */
const REFERRAL_CATEGORIES = new Set(["Defects at birth", "Developmental delays", "Disability"])

export interface ReferralForm {
  studentName: string
  className: string
  category: string
  severity: Severity
  screeningDate: string // ISO yyyy-mm-dd
  findings: string
  guardianPhone: string
  consent: boolean
}

export function emptyReferral(): ReferralForm {
  return { studentName: "", className: "", category: "", severity: "mild", screeningDate: "", findings: "", guardianPhone: "", consent: false }
}

export type FieldErrors = Partial<Record<keyof ReferralForm, string>>

const MIN_FINDINGS = 15

export function validateReferral(f: ReferralForm, asOf: Date = new Date()): { ok: boolean; errors: FieldErrors } {
  const e: FieldErrors = {}
  if (!f.studentName.trim()) e.studentName = "Student name is required"
  if (!f.className.trim()) e.className = "Class is required"
  if (!(RBSK_CATEGORIES as readonly string[]).includes(f.category)) e.category = "Select an RBSK category"
  if (!(SEVERITY_LEVELS as readonly string[]).includes(f.severity)) e.severity = "Select a severity"
  if (!f.screeningDate) e.screeningDate = "Screening date is required"
  else {
    const d = new Date(f.screeningDate)
    if (Number.isNaN(d.getTime())) e.screeningDate = "Enter a valid date"
    else if (d.getTime() > asOf.getTime()) e.screeningDate = "Screening date cannot be in the future"
  }
  if (f.findings.trim().length < MIN_FINDINGS) e.findings = `Record the findings (min ${MIN_FINDINGS} characters)`
  if (!/^\d{10}$/.test(f.guardianPhone.trim())) e.guardianPhone = "Enter a valid 10-digit guardian phone"
  if (!f.consent) e.consent = "Guardian consent (DPDP) is required to refer"
  return { ok: Object.keys(e).length === 0, errors: e }
}

/** True when the case needs the District specialist (DEIC) — severe, or a referral category. */
export function needsSpecialistReferral(f: ReferralForm): boolean {
  return f.severity === "severe" || REFERRAL_CATEGORIES.has(f.category)
}

/** Triage band shown to reviewers. */
export function triageBand(f: ReferralForm): "Routine" | "Priority" | "Urgent" {
  if (f.severity === "severe") return "Urgent"
  if (needsSpecialistReferral(f) || f.severity === "moderate") return "Priority"
  return "Routine"
}
