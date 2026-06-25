// VASA-EOS(SE) — Teacher transfer request form + eligibility (Roles & Hierarchy / Staff).
//
// Counselling-based transfers follow service rules: a minimum eligibility service (waived for
// medical / spouse / mutual grounds), a relieving NOC, and — when the requested district
// differs from the current one — Directorate sanction. This is the rich form + the pure rules
// that decide eligibility and whether the transfer is inter-district. Pure + client-safe.

export const TRANSFER_REASONS = [
  "Request (general)",
  "Mutual",
  "Medical",
  "Spouse / family",
  "Administrative",
] as const

export const TN_DISTRICTS = [
  "Chennai",
  "Coimbatore",
  "Madurai",
  "Salem",
  "The Nilgiris",
  "Thanjavur",
  "Tirunelveli",
  "Vellore",
] as const

/** Minimum service (years) to be eligible for a general request transfer. */
export const MIN_SERVICE_YEARS = 3
/** Grounds that waive the minimum-service requirement. */
const PRIORITY_GROUNDS = new Set(["Medical", "Spouse / family", "Mutual"])

export interface TransferForm {
  teacherName: string
  currentSchool: string
  currentDistrict: string
  requestedDistrict: string
  requestedSchool: string
  reason: string
  yearsOfService: number
  declaration: boolean
}

export function emptyTransfer(): TransferForm {
  return { teacherName: "", currentSchool: "", currentDistrict: "", requestedDistrict: "", requestedSchool: "", reason: "", yearsOfService: 0, declaration: false }
}

export type FieldErrors = Partial<Record<keyof TransferForm, string>>

export function validateTransfer(f: TransferForm): { ok: boolean; errors: FieldErrors } {
  const e: FieldErrors = {}
  if (!f.teacherName.trim()) e.teacherName = "Teacher name is required"
  if (!f.currentSchool.trim()) e.currentSchool = "Current school is required"
  if (!(TN_DISTRICTS as readonly string[]).includes(f.currentDistrict)) e.currentDistrict = "Select the current district"
  if (!(TN_DISTRICTS as readonly string[]).includes(f.requestedDistrict)) e.requestedDistrict = "Select the requested district"
  if (!f.requestedSchool.trim()) e.requestedSchool = "Requested school/place is required"
  if (!(TRANSFER_REASONS as readonly string[]).includes(f.reason)) e.reason = "Select a reason"
  if (!Number.isFinite(f.yearsOfService) || f.yearsOfService < 0 || f.yearsOfService > 40) e.yearsOfService = "Enter valid years of service (0–40)"
  else if (
    f.currentDistrict && f.requestedDistrict && f.currentDistrict === f.requestedDistrict && f.currentSchool.trim() &&
    f.currentSchool.trim().toLowerCase() === f.requestedSchool.trim().toLowerCase()
  )
    e.requestedSchool = "Requested place must differ from the current posting"
  if (!f.declaration) e.declaration = "You must certify the request particulars"
  return { ok: Object.keys(e).length === 0, errors: e }
}

/** True when the requested district differs from the current one (needs Directorate sanction). */
export function isInterDistrict(f: TransferForm): boolean {
  return Boolean(f.currentDistrict) && Boolean(f.requestedDistrict) && f.currentDistrict !== f.requestedDistrict
}

export interface TransferEligibility {
  eligible: boolean
  reason: string
}

/** Eligibility: priority grounds always qualify; general requests need the minimum service. */
export function transferEligibility(f: TransferForm): TransferEligibility {
  if (PRIORITY_GROUNDS.has(f.reason)) return { eligible: true, reason: `${f.reason} ground — minimum-service requirement waived` }
  if (f.yearsOfService >= MIN_SERVICE_YEARS) return { eligible: true, reason: `${f.yearsOfService} years of service ≥ ${MIN_SERVICE_YEARS}` }
  return { eligible: false, reason: `General request needs ≥ ${MIN_SERVICE_YEARS} years of service (has ${f.yearsOfService})` }
}
