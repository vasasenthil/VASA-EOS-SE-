// VASA-EOS(SE) — Assignments model + validation (Academic & Assessment).
//
// A teacher-set assignment (homework, project, worksheet…) for a class+subject, with a due date,
// max marks, instructions and a Draft/Assigned/Closed lifecycle. Pure, client-safe model shared by
// the create/edit forms, the list filters and the store. Full-CRUD module at Policies-grade depth.

import { CLASS_LEVELS, SUBJECT_AREAS } from "@/lib/courses"

export { CLASS_LEVELS, SUBJECT_AREAS }

export const ASSIGNMENT_STATUSES = ["Draft", "Assigned", "Closed"] as const
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number]

export const ASSIGNMENT_TYPES = ["Homework", "Project", "Worksheet", "Reading", "Lab"] as const
export type AssignmentType = (typeof ASSIGNMENT_TYPES)[number]

export interface Assignment {
  id: string
  title: string
  classLevel: string
  subject: string
  type: string
  dueDate: string
  maxMarks: number
  instructions: string
  teacher: string
  status: AssignmentStatus
  createdAt: string
  updatedAt: string
}

export interface AssignmentInput {
  title: string
  classLevel: string
  subject: string
  type: string
  dueDate: string
  maxMarks: number
  instructions: string
  teacher: string
  status: AssignmentStatus
}

export function emptyAssignment(): AssignmentInput {
  return { title: "", classLevel: "", subject: "", type: "Homework", dueDate: "", maxMarks: 20, instructions: "", teacher: "", status: "Draft" }
}

export type AssignmentErrors = Partial<Record<keyof AssignmentInput, string>>

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const MIN_INSTR = 10

export function validateAssignment(f: AssignmentInput): { ok: boolean; errors: AssignmentErrors } {
  const e: AssignmentErrors = {}
  if (!f.title.trim()) e.title = "Title is required"
  if (!(CLASS_LEVELS as readonly string[]).includes(f.classLevel)) e.classLevel = "Select the class"
  if (!(SUBJECT_AREAS as readonly string[]).includes(f.subject)) e.subject = "Select the subject"
  if (!(ASSIGNMENT_TYPES as readonly string[]).includes(f.type)) e.type = "Select the type"
  if (!DATE_RE.test(f.dueDate.trim())) e.dueDate = "Use a due date like 2026-06-30"
  if (!Number.isFinite(f.maxMarks) || f.maxMarks <= 0) e.maxMarks = "Max marks must be greater than 0"
  if (f.instructions.trim().length < MIN_INSTR) e.instructions = `Add instructions (min ${MIN_INSTR} characters)`
  if (!f.teacher.trim()) e.teacher = "Assign a teacher"
  if (!(ASSIGNMENT_STATUSES as readonly string[]).includes(f.status)) e.status = "Select a status"
  return { ok: Object.keys(e).length === 0, errors: e }
}

export type DueBand = "Overdue" | "Due soon" | "Upcoming" | "—"

/** Due-date band relative to a reference date (assigned items only). */
export function dueBand(dueDate: string, status: AssignmentStatus, asOf: Date = new Date()): DueBand {
  if (status !== "Assigned") return "—"
  const due = new Date(`${dueDate}T00:00:00Z`)
  if (Number.isNaN(due.getTime())) return "—"
  const days = Math.ceil((due.getTime() - asOf.getTime()) / 86400000)
  if (days < 0) return "Overdue"
  if (days <= 3) return "Due soon"
  return "Upcoming"
}

export interface AssignmentFilters {
  query?: string
  status?: string
  classLevel?: string
  subject?: string
  type?: string
  sortBy?: "title" | "dueDate" | "createdAt"
  sortDir?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export interface AssignmentPage {
  assignments: Assignment[]
  total: number
  totalPages: number
  page: number
  pageSize: number
}

const DEFAULT_PAGE_SIZE = 9

export function queryAssignments(all: Assignment[], f: AssignmentFilters = {}): AssignmentPage {
  const q = (f.query ?? "").trim().toLowerCase()
  let rows = all.filter((a) => {
    if (q && !(`${a.title} ${a.teacher}`.toLowerCase().includes(q))) return false
    if (f.status && a.status !== f.status) return false
    if (f.classLevel && a.classLevel !== f.classLevel) return false
    if (f.subject && a.subject !== f.subject) return false
    if (f.type && a.type !== f.type) return false
    return true
  })
  const dir = f.sortDir === "asc" ? 1 : -1
  const by = f.sortBy ?? "createdAt"
  rows = [...rows].sort((a, b) => {
    const av = by === "dueDate" ? a.dueDate : by === "title" ? a.title : a.createdAt
    const bv = by === "dueDate" ? b.dueDate : by === "title" ? b.title : b.createdAt
    return av < bv ? -dir : av > bv ? dir : 0
  })
  const pageSize = f.pageSize && f.pageSize > 0 ? f.pageSize : DEFAULT_PAGE_SIZE
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, f.page ?? 1), totalPages)
  const start = (page - 1) * pageSize
  return { assignments: rows.slice(start, start + pageSize), total, totalPages, page, pageSize }
}
