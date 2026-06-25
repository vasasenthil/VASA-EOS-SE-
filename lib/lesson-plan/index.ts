// VASA-EOS(SE) — lesson planning (Sec 16 / teacher prep, NCF 2023-aligned).
// Pure helpers for creating and scoring lesson plans; the UI captures the teacher's
// own plans and shows a completeness score so plans are classroom-ready.

export interface LessonPlan {
  id: string
  subject: string
  className: string
  topic: string
  objectives: string
  materials: string
  date: string
}

export function newPlanId(): string {
  return `LP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export const SAMPLE_PLANS: LessonPlan[] = [
  {
    id: "LP-SEED01",
    subject: "Mathematics",
    className: "Class 9-A",
    topic: "Fractions — addition & subtraction",
    objectives: "Add/subtract like and unlike fractions; relate to real-life measures.",
    materials: "Fraction strips, workbook",
    date: "2026-06-08",
  },
]

const SCORED_FIELDS: (keyof LessonPlan)[] = ["subject", "className", "topic", "objectives", "materials", "date"]

/** Percentage of the key planning fields that are filled in. */
export function planCompleteness(plan: LessonPlan): number {
  const filled = SCORED_FIELDS.filter((f) => String(plan[f] ?? "").trim().length > 0).length
  return Math.round((filled / SCORED_FIELDS.length) * 100)
}

export function isClassroomReady(plan: LessonPlan): boolean {
  return planCompleteness(plan) === 100
}
