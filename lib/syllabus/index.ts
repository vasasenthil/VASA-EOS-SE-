// VASA-EOS(SE) — subject-wise syllabus completion (pure logic).
//
// Backs the Principal dashboard's "Syllabus Completion" radar with live, durable data instead of a
// hardcoded array. Each subject has a teacher and a teaching-portion percentage; from the set we
// derive the average completion and how many subjects are behind the on-track threshold so the
// academic-monitoring headline is honest. Pure + client-safe so the same maths runs in tests and
// on the dashboard.

export interface SyllabusProgress {
  subject: string
  teacher: string
  pct: number
}

/** Subjects below this teaching-portion percentage are flagged "behind". */
export const ON_TRACK_PCT = 75

export interface SyllabusSummary {
  subjects: number
  avgPct: number
  behind: number
}

export function summarise(rows: SyllabusProgress[]): SyllabusSummary {
  const subjects = rows.length
  const total = rows.reduce((n, r) => n + r.pct, 0)
  const avgPct = subjects === 0 ? 0 : Math.round((total / subjects) * 10) / 10
  const behind = rows.filter((r) => r.pct < ON_TRACK_PCT).length
  return { subjects, avgPct, behind }
}
