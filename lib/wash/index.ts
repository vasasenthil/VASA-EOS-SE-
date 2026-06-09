// VASA-EOS(SE) — WASH / Swachh Vidyalaya audit (Sec 50 / health & hygiene).
// Water, sanitation and hygiene checklist with a derived star rating. Pure helpers.

export const WASH_CHECKLIST = [
  "Functional drinking water",
  "Separate girls' toilets",
  "Separate boys' toilets",
  "Handwashing with soap",
  "Toilets clean & usable",
  "Waste segregation",
  "Menstrual hygiene facilities",
]

export function washScore(checkedCount: number, total: number = WASH_CHECKLIST.length): number {
  return total === 0 ? 0 : Math.round((checkedCount / total) * 100)
}

export type WashRating = "5-star" | "4-star" | "3-star" | "needs improvement"

export function washRating(score: number): WashRating {
  if (score >= 90) return "5-star"
  if (score >= 75) return "4-star"
  if (score >= 50) return "3-star"
  return "needs improvement"
}

export interface WashAudit {
  id: string
  school: string
  date: string
  checked: string[]
}
