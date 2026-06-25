// VASA-EOS(SE) — citizen grievance filing form model + validation (Sec 48 redressal).
//
// A grievance is filed by a citizen — parent, student or member of the public — so the form must capture who is
// complaining, about what, where, and how urgent, with enough detail to act on. This is the rich filing model
// with per-field validation (identity, contact format, category, a substantive description, urgency, consent to
// process the complaint under DPDP) and a completeness score. Pure + client-safe; the server action files it
// into the three-tier escalation workflow (Principal → BEO → DEO).

export const GRIEVANCE_CATEGORIES = ["Scheme / DBT", "Fees", "Safety", "Teacher conduct", "Infrastructure", "Other"] as const
export const RELATIONSHIPS = ["Parent / Guardian", "Student", "Teacher", "Citizen"] as const
export const URGENCY_LEVELS = ["Low", "Medium", "High", "Critical"] as const

export interface GrievanceFilingForm {
  applicantName: string
  relationship: string
  contactPhone: string
  contactEmail: string
  category: string
  school: string
  district: string
  subject: string
  description: string
  urgency: string
  /** DPDP consent to process the complaint and contact the applicant. */
  consent: boolean
}

export function emptyGrievance(): GrievanceFilingForm {
  return {
    applicantName: "", relationship: "", contactPhone: "", contactEmail: "",
    category: "", school: "", district: "", subject: "", description: "", urgency: "Medium", consent: false,
  }
}

export type FieldErrors = Partial<Record<keyof GrievanceFilingForm, string>>

export const MIN_DESCRIPTION = 20

export function validateGrievance(f: GrievanceFilingForm): { ok: boolean; errors: FieldErrors } {
  const e: FieldErrors = {}
  if (!f.applicantName.trim()) e.applicantName = "Your name is required"
  if (!(RELATIONSHIPS as readonly string[]).includes(f.relationship)) e.relationship = "Select your relationship"
  if (!/^\d{10}$/.test(f.contactPhone.trim())) e.contactPhone = "Enter a 10-digit phone number"
  if (f.contactEmail.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.contactEmail.trim())) e.contactEmail = "Enter a valid email or leave blank"
  if (!(GRIEVANCE_CATEGORIES as readonly string[]).includes(f.category)) e.category = "Select a category"
  if (!f.school.trim()) e.school = "School is required"
  if (!f.district.trim()) e.district = "District is required"
  if (!f.subject.trim()) e.subject = "A short subject is required"
  if (f.description.trim().length < MIN_DESCRIPTION) e.description = `Describe the grievance in at least ${MIN_DESCRIPTION} characters`
  if (!(URGENCY_LEVELS as readonly string[]).includes(f.urgency)) e.urgency = "Select an urgency"
  if (!f.consent) e.consent = "Consent is required to process your complaint"
  return { ok: Object.keys(e).length === 0, errors: e }
}

const REQUIRED: (keyof GrievanceFilingForm)[] = ["applicantName", "relationship", "contactPhone", "category", "school", "district", "subject", "urgency"]

export function completenessPct(f: GrievanceFilingForm): number {
  let filled = 0
  const total = REQUIRED.length + 2 // + description + consent
  for (const k of REQUIRED) if (String(f[k]).trim()) filled++
  if (f.description.trim().length >= MIN_DESCRIPTION) filled++
  if (f.consent) filled++
  return Math.round((filled / total) * 100)
}
