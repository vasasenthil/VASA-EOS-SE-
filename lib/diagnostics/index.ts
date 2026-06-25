// VASA-EOS(SE) — Diagnostic Assessment & Remediation: Assessment Engine wired with HITL.
//
// AI-native, not a marks register: a teacher records a learner's awarded marks against a rubric
// (items tagged by curriculum objective); the Assessment Engine (lib/ai/engines/assessment, Engine
// 3 of 6) computes per-objective MASTERY, the weak objectives needing remediation, the band — all
// deterministic + explainable. The human then APPROVES a remediation plan and drives it to
// completion (HITL). The engine diagnoses; the teacher decides. The diagnosis is derived on read
// (never stored) so it's always reproducible.

import { assess, type AssessmentResult, type RubricItem, type ItemResponse } from "@/lib/ai/engines/assessment"
import { SUBJECT_AREAS } from "@/lib/courses"
import { CLASS_LEVELS, SECTIONS } from "@/lib/students"

export { SUBJECT_AREAS, CLASS_LEVELS, SECTIONS }
export type { AssessmentResult }

export const ASSESSMENT_TYPES = ["Diagnostic", "Formative (FA)", "Summative (SA)", "Unit Test"] as const
export type AssessmentType = (typeof ASSESSMENT_TYPES)[number]

export const PLAN_STATUSES = ["AI Draft", "Approved", "In Progress", "Completed"] as const
export type PlanStatus = (typeof PLAN_STATUSES)[number]

export interface RubricEntry {
  id: string
  objective: string
  marks: number
  awarded: number
}

export interface Diagnostic {
  id: string
  student: string
  apaarId: string
  classLevel: string
  section: string
  subject: string
  title: string
  assessmentType: string
  date: string
  items: RubricEntry[]
  planStatus: PlanStatus
  approvedBy: string
  remediation: string
  createdAt: string
  updatedAt: string
}

export interface DiagnosticInput {
  student: string
  apaarId: string
  classLevel: string
  section: string
  subject: string
  title: string
  assessmentType: string
  date: string
  items: RubricEntry[]
  planStatus: PlanStatus
  approvedBy: string
  remediation: string
}

export function emptyDiagnostic(): DiagnosticInput {
  return {
    student: "", apaarId: "", classLevel: "", section: "A", subject: "Mathematics", title: "",
    assessmentType: "Diagnostic", date: new Date().toISOString().slice(0, 10),
    items: [{ id: "i1", objective: "", marks: 10, awarded: 0 }],
    planStatus: "AI Draft", approvedBy: "", remediation: "",
  }
}

/** Run the Assessment Engine over the rubric entries — genuinely calls Engine 3, not a re-impl. */
export function diagnose(items: RubricEntry[]): AssessmentResult {
  const rubric: RubricItem[] = items.map((i) => ({ id: i.id, marks: i.marks, objective: i.objective || "Unspecified" }))
  const responses: ItemResponse[] = items.map((i) => ({ itemId: i.id, awarded: i.awarded }))
  return assess(rubric, responses)
}

/** A starter remediation plan the teacher reviews/edits before approving (AI suggests, human decides). */
export function suggestRemediation(result: AssessmentResult): string {
  if (result.weakObjectives.length === 0) return "On track — reinforce with enrichment tasks; no remediation required."
  return `Targeted remediation for weak objective(s): ${result.weakObjectives.join(", ")}. Re-teach with worked examples, assign graded practice, and re-assess after one week.`
}

export type DiagnosticErrors = Partial<Record<keyof DiagnosticInput, string>>

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function validateDiagnostic(f: DiagnosticInput): { ok: boolean; errors: DiagnosticErrors } {
  const e: DiagnosticErrors = {}
  if (!f.student.trim()) e.student = "Student is required"
  if (!(CLASS_LEVELS as readonly string[]).includes(f.classLevel)) e.classLevel = "Select the class"
  if (!(SECTIONS as readonly string[]).includes(f.section)) e.section = "Select the section"
  if (!(SUBJECT_AREAS as readonly string[]).includes(f.subject)) e.subject = "Select the subject"
  if (!f.title.trim()) e.title = "Title is required"
  if (!(ASSESSMENT_TYPES as readonly string[]).includes(f.assessmentType)) e.assessmentType = "Select the type"
  if (!DATE_RE.test(f.date.trim())) e.date = "Use a date like 2026-06-30"
  if (!(PLAN_STATUSES as readonly string[]).includes(f.planStatus)) e.planStatus = "Select a plan status"
  if (f.planStatus !== "AI Draft" && !f.approvedBy.trim()) e.approvedBy = "Approver is required once the plan leaves AI Draft"
  if (!Array.isArray(f.items) || f.items.length === 0) e.items = "Add at least one rubric item"
  else if (f.items.some((i) => !i.objective.trim() || !Number.isFinite(i.marks) || i.marks <= 0 || !Number.isFinite(i.awarded) || i.awarded < 0 || i.awarded > i.marks)) {
    e.items = "Each item needs an objective, marks > 0 and awarded within 0..marks"
  }
  return { ok: Object.keys(e).length === 0, errors: e }
}

export interface DiagnosticFilters {
  query?: string
  subject?: string
  classLevel?: string
  planStatus?: string
  sortBy?: "date" | "student"
  sortDir?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export interface DiagnosticSummary {
  total: number
  needingRemediation: number
  approved: number
  completed: number
}

export interface DiagnosticPage {
  diagnostics: Diagnostic[]
  total: number
  totalPages: number
  page: number
  pageSize: number
  summary: DiagnosticSummary
}

const DEFAULT_PAGE_SIZE = 9

export function diagnosticSummary(all: Diagnostic[]): DiagnosticSummary {
  let needingRemediation = 0, approved = 0, completed = 0
  for (const d of all) {
    if (diagnose(d.items).weakObjectives.length > 0) needingRemediation++
    if (d.planStatus === "Approved" || d.planStatus === "In Progress") approved++
    if (d.planStatus === "Completed") completed++
  }
  return { total: all.length, needingRemediation, approved, completed }
}

export function queryDiagnostics(all: Diagnostic[], f: DiagnosticFilters = {}): DiagnosticPage {
  const q = (f.query ?? "").trim().toLowerCase()
  let rows = all.filter((d) => {
    if (q && !(`${d.student} ${d.title} ${d.subject}`.toLowerCase().includes(q))) return false
    if (f.subject && d.subject !== f.subject) return false
    if (f.classLevel && d.classLevel !== f.classLevel) return false
    if (f.planStatus && d.planStatus !== f.planStatus) return false
    return true
  })
  const summary = diagnosticSummary(rows)
  const dir = f.sortDir === "asc" ? 1 : -1
  const by = f.sortBy ?? "date"
  rows = [...rows].sort((a, b) => {
    const av = by === "student" ? a.student : a.date
    const bv = by === "student" ? b.student : b.date
    return av < bv ? -dir : av > bv ? dir : 0
  })
  const pageSize = f.pageSize && f.pageSize > 0 ? f.pageSize : DEFAULT_PAGE_SIZE
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, f.page ?? 1), totalPages)
  const start = (page - 1) * pageSize
  return { diagnostics: rows.slice(start, start + pageSize), total, totalPages, page, pageSize, summary }
}
