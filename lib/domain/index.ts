// VASA-EOS(SE) — APAAR-centric domain model.
// Canonical entities from the dossier's ER diagram. Student anchors to APAAR (lifelong),
// School to UDISE+, Teacher to TN Teacher ID. Sensitive fields (Aadhaar/ABHA/UDID) are
// consent-gated; relationships are time-versioned; records are soft-deleted with audit.

export type ReservationCategory = "FC" | "BC" | "MBC" | "DNT" | "SC" | "ST" | "Minority"
export type JourneyStatus = "anganwadi" | "enrolled" | "transferred" | "dropout" | "alumni"

export interface Student {
  apaarId: string // PK — permanent, lifelong, national
  name: string
  dateOfBirth?: string
  gender?: "male" | "female" | "transgender"
  category?: ReservationCategory
  aadhaarRef?: string // consent-based, never stored raw
  abhaRef?: string // health, consent-based
  motherTongue?: string
  stateTenant: string
  district?: string
  block?: string
  cluster?: string
  currentSchoolUdise?: string
  journeyStatus: JourneyStatus
}

export type SchoolManagement =
  | "government"
  | "aided"
  | "private_unaided"
  | "adi_dravidar_welfare"
  | "bc_mbc_welfare"
  | "minority_welfare"
  | "kgbv"
  | "central"

export interface School {
  udiseCode: string // PK
  name: string
  management: SchoolManagement
  directorate?: string
  district?: string
  block?: string
  medium?: string
  boardAffiliation?: string
  classesOffered?: string
}

export interface Teacher {
  tnTeacherId: string // PK
  name: string
  aadhaarRef?: string
  cadre?: string
  subjects?: string[]
  qualifications?: string[]
  npstLevel?: "proficient" | "expert" | "lead" | "mentor"
  cpdCredits?: number
}

export interface Guardian {
  guardianId: string // linked to Aadhaar via consent
  name: string
  relation: "father" | "mother" | "guardian"
  phone?: string
  email?: string
  annualIncome?: number
  category?: ReservationCategory
}

export interface DisabilityRecord {
  udid: string // PK
  apaarId: string
  category: number // 1..21 RPwD categories
  severity?: "mild" | "moderate" | "severe" | "profound"
  iepId?: string
}

export interface SchemeBeneficiary {
  beneficiaryRecordId: string
  apaarId: string
  schemeCode: string
  eligibilityStatus: "eligible" | "ineligible" | "pending"
  amountInPaise?: number
  dbtStatus?: "queued" | "settled" | "failed"
  apbsReference?: string
}

export interface Credential {
  credentialId: string
  apaarId: string
  type: "TC" | "Class10" | "Class12" | "Matriculation"
  issuingAuthority: string
  digiLockerUri?: string
  blockchainAnchor?: string
  issueDate?: string
}

export interface JourneyEvent {
  journeyEventId: string
  apaarId: string
  eventType: "enrolment" | "transfer" | "stage_promotion" | "scholarship" | "award" | "exit"
  date: string
  schoolUdise?: string
  details?: Record<string, unknown>
}

/** The 21 RPwD disability categories (RPwD Act 2016). */
export const RPWD_CATEGORIES: readonly string[] = [
  "Blindness",
  "Low Vision",
  "Leprosy Cured",
  "Hearing Impairment",
  "Locomotor Disability",
  "Dwarfism",
  "Intellectual Disability",
  "Mental Illness",
  "Autism Spectrum Disorder",
  "Cerebral Palsy",
  "Muscular Dystrophy",
  "Chronic Neurological Conditions",
  "Specific Learning Disabilities",
  "Multiple Sclerosis",
  "Speech and Language Disability",
  "Thalassemia",
  "Haemophilia",
  "Sickle Cell Disease",
  "Multiple Disabilities (incl. deaf-blindness)",
  "Acid Attack Victim",
  "Parkinson's Disease",
] as const
