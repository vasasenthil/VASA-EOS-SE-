// VASA-EOS(SE) — student admission application form model + validation (RTE 2009 / APAAR).
//
// Admission is the front door to school. This is the rich application a parent files for a child — identity,
// age, social category, the class sought, guardian contact, address, the RTE 25% EWS claim, and the supporting
// documents — with per-field validation including an age-appropriateness check (RTE §4) and document
// completeness that adapts to the RTE claim. Pure + client-safe; the server action files it into the two-tier
// admission workflow (Academic Head document verification → Principal enrolment & APAAR provisioning).

export const GENDERS = ["Male", "Female", "Other"] as const
export const SOCIAL_CATEGORIES = ["General", "SC", "ST", "OBC", "EWS"] as const
export const CLASSES = ["Pre-KG", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"] as const
export const DOCUMENTS = ["Birth certificate", "Address proof", "Photograph", "Transfer certificate", "Income certificate (RTE)", "Aadhaar / APAAR"] as const
const CORE_DOCS = ["Birth certificate", "Address proof", "Photograph"]

export interface AdmissionApplicationForm {
  studentName: string
  dob: string // ISO yyyy-mm-dd
  gender: string
  socialCategory: string
  className: string
  guardianName: string
  guardianPhone: string
  guardianEmail: string
  address: string
  previousSchool: string
  /** Claiming a 25% EWS/disadvantaged seat under RTE §12(1)(c). */
  rteQuota: boolean
  documents: string[]
  declaration: boolean
}

export function emptyAdmission(): AdmissionApplicationForm {
  return {
    studentName: "", dob: "", gender: "", socialCategory: "", className: "",
    guardianName: "", guardianPhone: "", guardianEmail: "", address: "", previousSchool: "",
    rteQuota: false, documents: [], declaration: false,
  }
}

export type FieldErrors = Partial<Record<keyof AdmissionApplicationForm, string>>

/** Age in whole years on the reference date. */
export function ageYears(dobISO: string, asOf: Date = new Date()): number {
  const dob = new Date(dobISO)
  let age = asOf.getFullYear() - dob.getFullYear()
  const m = asOf.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && asOf.getDate() < dob.getDate())) age--
  return age
}

export function validateAdmission(f: AdmissionApplicationForm, asOf: Date = new Date()): { ok: boolean; errors: FieldErrors } {
  const e: FieldErrors = {}
  if (!f.studentName.trim()) e.studentName = "Student name is required"

  if (!f.dob) e.dob = "Date of birth is required"
  else {
    const d = new Date(f.dob)
    if (Number.isNaN(d.getTime())) e.dob = "Enter a valid date"
    else if (d.getTime() > asOf.getTime()) e.dob = "Date of birth cannot be in the future"
    else {
      const age = ageYears(f.dob, asOf)
      if (age < 2 || age > 20) e.dob = "Age must be appropriate for school admission (RTE §4)"
    }
  }

  if (!(GENDERS as readonly string[]).includes(f.gender)) e.gender = "Select gender"
  if (!(SOCIAL_CATEGORIES as readonly string[]).includes(f.socialCategory)) e.socialCategory = "Select social category"
  if (!(CLASSES as readonly string[]).includes(f.className)) e.className = "Select the class sought"
  if (!f.guardianName.trim()) e.guardianName = "Guardian name is required"
  if (!/^\d{10}$/.test(f.guardianPhone.trim())) e.guardianPhone = "Enter a 10-digit phone number"
  if (f.guardianEmail.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.guardianEmail.trim())) e.guardianEmail = "Enter a valid email or leave blank"
  if (f.address.trim().length < 10) e.address = "Enter the full residential address"

  // Document completeness adapts to the RTE claim.
  const missingCore = CORE_DOCS.filter((d) => !f.documents.includes(d))
  if (missingCore.length) e.documents = `Attach the core documents: ${missingCore.join(", ")}`
  else if (f.rteQuota && !f.documents.includes("Income certificate (RTE)")) e.documents = "An income certificate is required for the RTE 25% claim"

  if (!f.declaration) e.declaration = "You must accept the declaration"
  return { ok: Object.keys(e).length === 0, errors: e }
}

const REQUIRED: (keyof AdmissionApplicationForm)[] = ["studentName", "dob", "gender", "socialCategory", "className", "guardianName", "guardianPhone", "address"]

export function completenessPct(f: AdmissionApplicationForm): number {
  let filled = 0
  const total = REQUIRED.length + 2 // + documents + declaration
  for (const k of REQUIRED) if (String(f[k]).trim()) filled++
  if (CORE_DOCS.every((d) => f.documents.includes(d))) filled++
  if (f.declaration) filled++
  return Math.round((filled / total) * 100)
}
