// VASA-EOS(SE) — Consolidated student report cards (Academic & Assessment).
//
// A report card is a term result for one student: per-subject marks rolled up into a total,
// percentage, overall letter grade and a Pass/Fail outcome, plus attendance and remarks, with a
// Draft/Published lifecycle. Pure, client-safe model shared by the form, the list filters and the
// store. Full-CRUD module at Policies-grade depth — the richest, with a nested per-subject array.
//
// Distinct from lib/results (the exam-publication board): this manages individual report cards.

import { CLASS_LEVELS, SUBJECT_AREAS } from "@/lib/courses"
import { TERMS, letterGrade } from "@/lib/grades"

export { CLASS_LEVELS, SUBJECT_AREAS, TERMS, letterGrade }

export const REPORT_CARD_STATUSES = ["Draft", "Published"] as const
export type ReportCardStatus = (typeof REPORT_CARD_STATUSES)[number]

/** Minimum percentage in every subject (and overall) to pass — TN/CBSE convention. */
export const PASS_MARK_PCT = 33

export interface SubjectResult {
  subject: string
  marks: number
  maxMarks: number
}

export interface ReportCard {
  id: string
  student: string
  apaarId: string
  classLevel: string
  term: string
  subjects: SubjectResult[]
  attendancePct: number
  remarks: string
  status: ReportCardStatus
  createdAt: string
  updatedAt: string
}

export interface ReportCardInput {
  student: string
  apaarId: string
  classLevel: string
  term: string
  subjects: SubjectResult[]
  attendancePct: number
  remarks: string
  status: ReportCardStatus
}

export function emptyReportCard(): ReportCardInput {
  return {
    student: "", apaarId: "", classLevel: "", term: "Annual",
    subjects: [{ subject: "", marks: 0, maxMarks: 100 }],
    attendancePct: 95, remarks: "", status: "Draft",
  }
}

export interface ReportTotals {
  obtained: number
  max: number
  pct: number
  grade: string
  outcome: "Pass" | "Fail"
}

function pct(obtained: number, max: number): number {
  return max > 0 ? Math.round((obtained / max) * 1000) / 10 : 0
}

/** Roll the per-subject marks into the consolidated totals, grade and Pass/Fail outcome. */
export function reportTotals(subjects: SubjectResult[]): ReportTotals {
  const obtained = subjects.reduce((s, r) => s + (Number.isFinite(r.marks) ? r.marks : 0), 0)
  const max = subjects.reduce((s, r) => s + (Number.isFinite(r.maxMarks) ? r.maxMarks : 0), 0)
  const overall = pct(obtained, max)
  const everySubjectPassed = subjects.length > 0 && subjects.every((r) => pct(r.marks, r.maxMarks) >= PASS_MARK_PCT)
  const outcome: "Pass" | "Fail" = everySubjectPassed && overall >= PASS_MARK_PCT ? "Pass" : "Fail"
  return { obtained, max, pct: overall, grade: letterGrade(overall), outcome }
}

export type ReportCardErrors = Partial<Record<keyof ReportCardInput, string>>

const APAAR_RE = /^\d{12}$/

export function validateReportCard(f: ReportCardInput): { ok: boolean; errors: ReportCardErrors } {
  const e: ReportCardErrors = {}
  if (!f.student.trim()) e.student = "Student name is required"
  if (f.apaarId.trim() && !APAAR_RE.test(f.apaarId.trim())) e.apaarId = "APAAR id must be 12 digits (or leave blank)"
  if (!(CLASS_LEVELS as readonly string[]).includes(f.classLevel)) e.classLevel = "Select the class"
  if (!(TERMS as readonly string[]).includes(f.term)) e.term = "Select the term"
  if (!Number.isFinite(f.attendancePct) || f.attendancePct < 0 || f.attendancePct > 100) e.attendancePct = "Attendance must be 0–100"
  if (!(REPORT_CARD_STATUSES as readonly string[]).includes(f.status)) e.status = "Select a status"
  if (!Array.isArray(f.subjects) || f.subjects.length === 0) {
    e.subjects = "Add at least one subject"
  } else {
    const seen = new Set<string>()
    for (const r of f.subjects) {
      if (!(SUBJECT_AREAS as readonly string[]).includes(r.subject)) { e.subjects = "Each row needs a valid subject"; break }
      if (seen.has(r.subject)) { e.subjects = "Each subject can appear only once"; break }
      seen.add(r.subject)
      if (!Number.isFinite(r.maxMarks) || r.maxMarks <= 0) { e.subjects = "Max marks must be greater than 0"; break }
      if (!Number.isFinite(r.marks) || r.marks < 0 || r.marks > r.maxMarks) { e.subjects = "Marks must be between 0 and max"; break }
    }
  }
  return { ok: Object.keys(e).length === 0, errors: e }
}

export interface ReportCardFilters {
  query?: string
  status?: string
  classLevel?: string
  term?: string
  outcome?: string
  sortBy?: "student" | "createdAt" | "pct"
  sortDir?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export interface ReportCardPage {
  cards: ReportCard[]
  total: number
  totalPages: number
  page: number
  pageSize: number
}

const DEFAULT_PAGE_SIZE = 10

export function queryReportCards(all: ReportCard[], f: ReportCardFilters = {}): ReportCardPage {
  const q = (f.query ?? "").trim().toLowerCase()
  let rows = all.filter((r) => {
    if (q && !(`${r.student} ${r.apaarId}`.toLowerCase().includes(q))) return false
    if (f.status && r.status !== f.status) return false
    if (f.classLevel && r.classLevel !== f.classLevel) return false
    if (f.term && r.term !== f.term) return false
    if (f.outcome && reportTotals(r.subjects).outcome !== f.outcome) return false
    return true
  })
  const dir = f.sortDir === "asc" ? 1 : -1
  const by = f.sortBy ?? "createdAt"
  rows = [...rows].sort((a, b) => {
    const av = by === "pct" ? reportTotals(a.subjects).pct : by === "student" ? a.student : a.createdAt
    const bv = by === "pct" ? reportTotals(b.subjects).pct : by === "student" ? b.student : b.createdAt
    return av < bv ? -dir : av > bv ? dir : 0
  })
  const pageSize = f.pageSize && f.pageSize > 0 ? f.pageSize : DEFAULT_PAGE_SIZE
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, f.page ?? 1), totalPages)
  const start = (page - 1) * pageSize
  return { cards: rows.slice(start, start + pageSize), total, totalPages, page, pageSize }
}
