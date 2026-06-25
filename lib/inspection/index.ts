// VASA-EOS(SE) — school inspection visits (Sec 46 / CRCC·BEO field operations).
// GPS-verified visits with a standard checklist and a derived score/rating.
// Pure helpers; the UI captures the visit and lists past visits.

export const INSPECTION_CHECKLIST = [
  "Classrooms functional",
  "Toilets clean & usable",
  "Drinking water available",
  "Mid-day meal served",
  "Teachers present",
  "TLM / smart class in use",
  "Library accessible",
  "Records up to date",
]

export interface Visit {
  id: string
  school: string
  officer: string
  date: string
  gpsVerified: boolean
  checked: string[]
  notes?: string
}

export function visitScore(checkedCount: number, total: number = INSPECTION_CHECKLIST.length): number {
  return total === 0 ? 0 : Math.round((checkedCount / total) * 100)
}

export type VisitRating = "good" | "fair" | "poor"

export function visitRating(score: number): VisitRating {
  if (score >= 80) return "good"
  if (score >= 50) return "fair"
  return "poor"
}
