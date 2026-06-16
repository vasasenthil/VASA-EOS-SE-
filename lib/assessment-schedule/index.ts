// VASA-EOS(SE) — school assessment schedule (pure logic).
//
// Backs the Principal dashboard's "Upcoming Assessments" block with live, durable data instead of
// a hardcoded array. Each entry is a planned assessment (unit test, practical, formative, project)
// for a class, with a date label and a status. From the set we derive how many are still upcoming
// (not yet completed). Pure + client-safe so the same maths runs in tests and on the dashboard.

export const ASSESSMENT_STATUSES = ["Scheduled", "Preparation", "Completed"] as const
export type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[number]

export interface ScheduledAssessment {
  subject: string
  cls: string
  type: string
  date: string
  status: AssessmentStatus
}

export interface ScheduleSummary {
  total: number
  upcoming: number
  completed: number
}

export function summarise(items: ScheduledAssessment[]): ScheduleSummary {
  const total = items.length
  const completed = items.filter((i) => i.status === "Completed").length
  return { total, upcoming: total - completed, completed }
}
