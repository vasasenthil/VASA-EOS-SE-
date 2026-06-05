// VASA-EOS(SE) — admissions / enrolment intake (Sec 25 / APAAR onboarding).
// New-student intake that provisions a (mock) APAAR id. Pure validation + id minting;
// production routes through the APAAR IdentityProvider.

export type AdmissionStatus = "submitted" | "verified" | "enrolled"

export interface Applicant {
  id: string
  name: string
  dob: string
  gender: string
  category: string
  className: string
  apaarId?: string
  status: AdmissionStatus
}

export interface ApplicantInput {
  name: string
  dob: string
  gender: string
  category: string
  className: string
}

/** null if valid, else the first validation error. */
export function validateApplicant(input: ApplicantInput): string | null {
  if (!input.name.trim()) return "Student name is required."
  if (!input.dob) return "Date of birth is required."
  if (!input.className.trim()) return "Class is required."
  return null
}

/** Deterministic mock APAAR id (12 digits) for the demo intake. */
export function makeApaarId(seq: number): string {
  return `APAAR-${(100000000000 + seq).toString()}`
}
