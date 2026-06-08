// VASA-EOS(SE) — Khelo India / fitness-test register (physical literacy).
// Record fitness-test scores and grade each result. Pure logic.

export const FITNESS_TESTS = [
  "BMI / body composition",
  "Strength (push-ups)",
  "Endurance (600m run)",
  "Flexibility (sit & reach)",
  "Speed (50m dash)",
]

export type FitnessGrade = "Needs improvement" | "Healthy" | "Excellent"

// Score is a normalised 0–100 percentile against the age-band benchmark.
export function gradeFor(score: number): FitnessGrade {
  if (score < 40) return "Needs improvement"
  if (score < 70) return "Healthy"
  return "Excellent"
}

export interface FitnessRecord {
  id: string
  student: string
  cls: string
  test: string
  score: number
  grade: FitnessGrade
  /** Tenant node this record belongs to — drives per-role data scoping. */
  tenantId: string
}

export interface FitnessSummary {
  records: number
  students: number
  avgScore: number
  excellent: number
  needsAttention: number
}

export function fitnessSummary(records: FitnessRecord[]): FitnessSummary {
  const n = records.length
  return {
    records: n,
    students: new Set(records.map((r) => r.student)).size,
    avgScore: n === 0 ? 0 : Math.round(records.reduce((sum, r) => sum + r.score, 0) / n),
    excellent: records.filter((r) => r.grade === "Excellent").length,
    needsAttention: records.filter((r) => r.grade === "Needs improvement").length,
  }
}
