// VASA-EOS(SE) — Gradebook model + validation (Academic & Assessment).
//
// A gradebook entry: a student's marks in one assessment of one subject, for a term, with a derived
// percentage and TN/CBSE-style letter grade and a Draft/Published lifecycle. Pure, client-safe
// model shared by the create/edit forms, the list filters and the store. Full-CRUD module built to
// the Policies-grade depth standard.

import { CLASS_LEVELS, SUBJECT_AREAS } from "@/lib/courses"

export { CLASS_LEVELS, SUBJECT_AREAS }

export const GRADE_STATUSES = ["Draft", "Published"] as const
export type GradeStatus = (typeof GRADE_STATUSES)[number]

export const TERMS = ["Term 1", "Term 2", "Annual"] as const
export type Term = (typeof TERMS)[number]

export const ASSESSMENTS = ["FA1", "FA2", "SA1", "SA2", "Unit Test", "Project"] as const
export type Assessment = (typeof ASSESSMENTS)[number]

export interface Grade {
  id: string
  student: string
  apaarId: string
  classLevel: string
  subject: string
  term: string
  assessment: string
  marks: number
  maxMarks: number
  status: GradeStatus
  createdAt: string
  updatedAt: string
}

export interface GradeInput {
  student: string
  apaarId: string
  classLevel: string
  subject: string
  term: string
  assessment: string
  marks: number
  maxMarks: number
  status: GradeStatus
}

export function emptyGrade(): GradeInput {
  return { student: "", apaarId: "", classLevel: "", subject: "", term: "Term 1", assessment: "FA1", marks: 0, maxMarks: 100, status: "Draft" }
}

/** Percentage (1 dp), 0 when maxMarks is 0. */
export function percentage(marks: number, maxMarks: number): number {
  return maxMarks > 0 ? Math.round((marks / maxMarks) * 1000) / 10 : 0
}

/** TN/CBSE-style letter grade from a percentage. */
export function letterGrade(pct: number): string {
  if (pct >= 91) return "A1"
  if (pct >= 81) return "A2"
  if (pct >= 71) return "B1"
  if (pct >= 61) return "B2"
  if (pct >= 51) return "C1"
  if (pct >= 41) return "C2"
  if (pct >= 33) return "D"
  return "E"
}

export type GradeErrors = Partial<Record<keyof GradeInput, string>>

const APAAR_RE = /^\d{12}$/

export function validateGrade(f: GradeInput): { ok: boolean; errors: GradeErrors } {
  const e: GradeErrors = {}
  if (!f.student.trim()) e.student = "Student name is required"
  if (f.apaarId.trim() && !APAAR_RE.test(f.apaarId.trim())) e.apaarId = "APAAR id must be 12 digits (or leave blank)"
  if (!(CLASS_LEVELS as readonly string[]).includes(f.classLevel)) e.classLevel = "Select the class"
  if (!(SUBJECT_AREAS as readonly string[]).includes(f.subject)) e.subject = "Select the subject"
  if (!(TERMS as readonly string[]).includes(f.term)) e.term = "Select the term"
  if (!(ASSESSMENTS as readonly string[]).includes(f.assessment)) e.assessment = "Select the assessment"
  if (!Number.isFinite(f.maxMarks) || f.maxMarks <= 0) e.maxMarks = "Max marks must be greater than 0"
  if (!Number.isFinite(f.marks) || f.marks < 0) e.marks = "Marks cannot be negative"
  else if (Number.isFinite(f.maxMarks) && f.marks > f.maxMarks) e.marks = "Marks cannot exceed max marks"
  if (!(GRADE_STATUSES as readonly string[]).includes(f.status)) e.status = "Select a status"
  return { ok: Object.keys(e).length === 0, errors: e }
}

export interface GradeFilters {
  query?: string
  status?: string
  classLevel?: string
  subject?: string
  term?: string
  sortBy?: "student" | "createdAt" | "marks"
  sortDir?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export interface GradePage {
  grades: Grade[]
  total: number
  totalPages: number
  page: number
  pageSize: number
}

const DEFAULT_PAGE_SIZE = 10

export function queryGrades(all: Grade[], f: GradeFilters = {}): GradePage {
  const q = (f.query ?? "").trim().toLowerCase()
  let rows = all.filter((g) => {
    if (q && !(`${g.student} ${g.apaarId}`.toLowerCase().includes(q))) return false
    if (f.status && g.status !== f.status) return false
    if (f.classLevel && g.classLevel !== f.classLevel) return false
    if (f.subject && g.subject !== f.subject) return false
    if (f.term && g.term !== f.term) return false
    return true
  })
  const dir = f.sortDir === "asc" ? 1 : -1
  const by = f.sortBy ?? "createdAt"
  rows = [...rows].sort((a, b) => {
    const av = by === "marks" ? a.marks : by === "student" ? a.student : a.createdAt
    const bv = by === "marks" ? b.marks : by === "student" ? b.student : b.createdAt
    return av < bv ? -dir : av > bv ? dir : 0
  })
  const pageSize = f.pageSize && f.pageSize > 0 ? f.pageSize : DEFAULT_PAGE_SIZE
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, f.page ?? 1), totalPages)
  const start = (page - 1) * pageSize
  return { grades: rows.slice(start, start + pageSize), total, totalPages, page, pageSize }
}
