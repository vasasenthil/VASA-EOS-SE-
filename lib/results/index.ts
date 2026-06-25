// VASA-EOS(SE) — result publication / marksheet (Flagship 05 / DGE).
// Pure pass/fail, division and result computation; the UI publishes per student.

import { SIS_ROSTER } from "@/lib/sis"

export const PASS_MARK = 35
export const RESULT_SUBJECTS = ["Tamil", "English", "Mathematics", "Science", "Social Science"]

export interface SubjectMark {
  subject: string
  marks: number
}

export function isPass(marks: number): boolean {
  return marks >= PASS_MARK
}

export type Division = "Distinction" | "First" | "Second" | "Third" | "Fail"

export function division(percentage: number, allPass: boolean): Division {
  if (!allPass) return "Fail"
  if (percentage >= 75) return "Distinction"
  if (percentage >= 60) return "First"
  if (percentage >= 50) return "Second"
  return "Third"
}

export interface StudentResult {
  apaarId: string
  name: string
  subjects: SubjectMark[]
  total: number
  max: number
  percentage: number
  allPass: boolean
  division: Division
}

export function computeResult(apaarId: string, name: string, subjects: SubjectMark[]): StudentResult {
  const total = subjects.reduce((s, x) => s + x.marks, 0)
  const max = subjects.length * 100
  const percentage = max === 0 ? 0 : Math.round((total / max) * 100)
  const allPass = subjects.every((s) => isPass(s.marks))
  return { apaarId, name, subjects, total, max, percentage, allPass, division: division(percentage, allPass) }
}

/** Deterministic seeded results across the roster (illustrative marks). */
export function buildResults(): StudentResult[] {
  return SIS_ROSTER.map((stu, i) =>
    computeResult(
      stu.apaarId,
      stu.name,
      RESULT_SUBJECTS.map((subject, j) => ({ subject, marks: 30 + ((i * 13 + j * 17) % 65) })),
    ),
  )
}
