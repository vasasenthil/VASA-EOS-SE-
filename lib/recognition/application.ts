// VASA-EOS(SE) — rich school-recognition application form model + validation (TN 1973 Act).
//
// The substance of a real multi-field form is its validation. This is the full application a school files for
// recognition/renewal — identity, jurisdiction, management, trust/UDISE identifiers, land status, contact and the
// six statutory eligibility criteria — with per-field validation (required, email/phone/UDISE format, criteria
// minimum, declaration) and a completeness score. Pure + client-safe so both the form UI and tests use the same
// rules; the server action persists the validated result through the recognition workflow.

import { ELIGIBILITY_CRITERIA } from "@/lib/recognition"

export type ApplicationType = "new" | "renewal"
export const MANAGEMENT_OPTIONS = ["Government", "Aided", "Private Unaided", "Minority", "Central Govt"] as const
export const LAND_STATUS_OPTIONS = ["Owned", "Leased (30+ years)", "Leased (under 30 years)"] as const

export interface RecognitionApplicationForm {
  school: string
  district: string
  block: string
  type: ApplicationType
  management: string
  /** Trust/Society registration number (mandatory for a new recognition). */
  trustRegNo: string
  /** 11-digit UDISE code (mandatory for a renewal; the school already exists). */
  udiseCode: string
  landStatus: string
  contactEmail: string
  contactPhone: string
  /** Subset of the six statutory criteria the applicant attests to. */
  criteriaMet: string[]
  /** The applicant's declaration of truthfulness — must be accepted. */
  declaration: boolean
}

export function emptyApplication(): RecognitionApplicationForm {
  return {
    school: "", district: "", block: "", type: "new", management: "",
    trustRegNo: "", udiseCode: "", landStatus: "", contactEmail: "", contactPhone: "",
    criteriaMet: [], declaration: false,
  }
}

/** The fields that count toward completeness (criteria + declaration handled separately). */
const REQUIRED_TEXT: (keyof RecognitionApplicationForm)[] = ["school", "district", "block", "management", "landStatus", "contactEmail", "contactPhone"]

export type FieldErrors = Partial<Record<keyof RecognitionApplicationForm, string>>

export function validateApplication(f: RecognitionApplicationForm): { ok: boolean; errors: FieldErrors } {
  const e: FieldErrors = {}
  if (!f.school.trim()) e.school = "School name is required"
  if (!f.district.trim()) e.district = "District is required"
  if (!f.block.trim()) e.block = "Block is required"
  if (!f.management) e.management = "Select a management type"
  if (!(MANAGEMENT_OPTIONS as readonly string[]).includes(f.management) && f.management) e.management = "Invalid management type"
  if (!f.landStatus) e.landStatus = "Select land status"

  // Identifier rules depend on the application type (the type-specific rule takes precedence).
  if (f.type === "renewal") {
    if (!/^\d{11}$/.test(f.udiseCode.trim())) e.udiseCode = "A valid 11-digit UDISE code is required for renewal"
  } else {
    if (!f.trustRegNo.trim()) e.trustRegNo = "Trust/Society registration number is required for a new school"
    if (f.udiseCode.trim() && !/^\d{11}$/.test(f.udiseCode.trim())) e.udiseCode = "UDISE code must be 11 digits"
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.contactEmail.trim())) e.contactEmail = "Enter a valid email address"
  if (!/^\d{10}$/.test(f.contactPhone.trim())) e.contactPhone = "Enter a 10-digit phone number"

  if (f.criteriaMet.length < 4) e.criteriaMet = "At least 4 of the 6 statutory criteria must be attested"
  for (const c of f.criteriaMet) {
    if (!(ELIGIBILITY_CRITERIA as readonly string[]).includes(c)) { e.criteriaMet = "Unknown eligibility criterion"; break }
  }
  if (!f.declaration) e.declaration = "You must accept the declaration"

  return { ok: Object.keys(e).length === 0, errors: e }
}

/** Completeness as a percentage across all required inputs (for a progress indicator). */
export function completenessPct(f: RecognitionApplicationForm): number {
  let filled = 0
  let total = REQUIRED_TEXT.length + 3 // + identifier + criteria + declaration
  for (const k of REQUIRED_TEXT) if (String(f[k]).trim()) filled++
  if ((f.type === "new" && f.trustRegNo.trim()) || (f.type === "renewal" && /^\d{11}$/.test(f.udiseCode.trim()))) filled++
  if (f.criteriaMet.length >= 4) filled++
  if (f.declaration) filled++
  return Math.round((filled / total) * 100)
}
