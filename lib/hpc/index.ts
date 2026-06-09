// VASA-EOS(SE) — Holistic Progress Card (Flagship / NEP HPC, Sec 24).
// Pure grading: CBSE-style 8-point bands → grade points → CGPA, with a descriptor.
// The UI lets a teacher enter a student's marks and renders the card live.

export type Grade = "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "D" | "E"

interface Band {
  grade: Grade
  min: number
  points: number
}

// 91-100 A1 … <33 E (CBSE-style).
const BANDS: Band[] = [
  { grade: "A1", min: 91, points: 10 },
  { grade: "A2", min: 81, points: 9 },
  { grade: "B1", min: 71, points: 8 },
  { grade: "B2", min: 61, points: 7 },
  { grade: "C1", min: 51, points: 6 },
  { grade: "C2", min: 41, points: 5 },
  { grade: "D", min: 33, points: 4 },
  { grade: "E", min: 0, points: 0 },
]

export const HPC_SUBJECTS = ["Tamil", "English", "Mathematics", "Science", "Social Science"]

export function gradeFor(marks: number): Grade {
  const m = Math.max(0, Math.min(100, marks))
  return (BANDS.find((b) => m >= b.min) ?? BANDS[BANDS.length - 1]).grade
}

export function pointsFor(grade: Grade): number {
  return BANDS.find((b) => b.grade === grade)?.points ?? 0
}

export interface SubjectResult {
  subject: string
  marks: number
  grade: Grade
  points: number
}

export interface HpcResult {
  subjects: SubjectResult[]
  total: number
  max: number
  percentage: number
  cgpa: number
  descriptor: string
}

function descriptorFor(pct: number): string {
  if (pct >= 91) return "Outstanding — consistently exceeds expectations."
  if (pct >= 71) return "Proficient — strong, well-rounded performance."
  if (pct >= 51) return "Developing — steady progress; targeted support helps."
  if (pct >= 33) return "Emerging — needs focused remediation."
  return "Needs significant support — intervention recommended."
}

// ── Co-scholastic domains (NEP holistic development, rated 1-5) ───────────────
export const CO_SCHOLASTIC_DOMAINS = [
  "Life Skills",
  "Arts & Aesthetics",
  "Health & Physical Education",
  "Work Education",
  "Values & Citizenship",
]

export type CoScholasticGrade = "A" | "B" | "C" | "D"

/** Map a 1-5 rating to an A-D co-scholastic grade. */
export function coScholasticGrade(rating: number): CoScholasticGrade {
  const r = Math.max(1, Math.min(5, rating))
  if (r >= 4) return "A"
  if (r >= 3) return "B"
  if (r >= 2) return "C"
  return "D"
}

export interface CoScholasticResult {
  domain: string
  rating: number
  grade: CoScholasticGrade
}

export function computeCoScholastic(
  ratings: Record<string, number>,
  domains: string[] = CO_SCHOLASTIC_DOMAINS,
): CoScholasticResult[] {
  return domains.map((domain) => {
    const rating = Math.max(1, Math.min(5, ratings[domain] ?? 3))
    return { domain, rating, grade: coScholasticGrade(rating) }
  })
}

export function computeHpc(marksBySubject: Record<string, number>, subjects: string[] = HPC_SUBJECTS): HpcResult {
  const results: SubjectResult[] = subjects.map((subject) => {
    const marks = Math.max(0, Math.min(100, marksBySubject[subject] ?? 0))
    const grade = gradeFor(marks)
    return { subject, marks, grade, points: pointsFor(grade) }
  })
  const total = results.reduce((s, r) => s + r.marks, 0)
  const max = subjects.length * 100
  const percentage = max === 0 ? 0 : Math.round((total / max) * 100)
  const cgpa = results.length === 0 ? 0 : Math.round((results.reduce((s, r) => s + r.points, 0) / results.length) * 10) / 10
  return { subjects: results, total, max, percentage, cgpa, descriptor: descriptorFor(percentage) }
}
