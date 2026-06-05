// VASA-EOS(SE) — vocational education & skills (NEP 2020, NSQF integration).
// Enrol students into NSQF trades and track certification. Pure logic.

export const VOC_TRADES = [
  "Agriculture",
  "IT / ITeS",
  "Healthcare",
  "Retail",
  "Beauty & Wellness",
  "Automotive",
  "Electronics & Hardware",
  "Apparel & Textiles",
  "Tourism & Hospitality",
  "Plumbing",
]

export const NSQF_LEVELS = [1, 2, 3, 4]

export interface VocEnrolment {
  id: string
  student: string
  trade: string
  level: number
  certified: boolean
}

export interface VocSummary {
  total: number
  certified: number
  inProgress: number
  trades: number
}

export function vocSummary(enrolments: VocEnrolment[]): VocSummary {
  return {
    total: enrolments.length,
    certified: enrolments.filter((e) => e.certified).length,
    inProgress: enrolments.filter((e) => !e.certified).length,
    trades: new Set(enrolments.map((e) => e.trade)).size,
  }
}
