// VASA-EOS(SE) — CWSN / children with special needs IEP tracker (RPwD Act, NEP inclusion).
// Register CWSN students, record accommodations and IEP goals, track review. Pure logic.

export const DISABILITY_TYPES = [
  "Locomotor disability",
  "Visual impairment",
  "Hearing impairment",
  "Speech & language",
  "Intellectual disability",
  "Specific learning disability",
  "Autism spectrum",
  "Multiple disabilities",
]

export const CWSN_SUPPORTS = [
  "Assistive device",
  "Scribe / reader",
  "Extra examination time",
  "Resource / special teacher",
  "Ramp / accessible seating",
  "Therapy referral",
]

export interface CwsnStudent {
  id: string
  name: string
  cls: string
  disability: string
  supports: string[]
  iepGoal: string
  reviewed: boolean
  /** Tenant node this learner belongs to — drives per-role data scoping. */
  tenantId: string
}

export interface CwsnSummary {
  total: number
  reviewed: number
  pending: number
  withDevice: number
}

export function cwsnSummary(students: CwsnStudent[]): CwsnSummary {
  return {
    total: students.length,
    reviewed: students.filter((s) => s.reviewed).length,
    pending: students.filter((s) => !s.reviewed).length,
    withDevice: students.filter((s) => s.supports.includes("Assistive device")).length,
  }
}
