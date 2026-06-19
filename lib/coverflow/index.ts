// VASA-EOS(SE) — Substitute / Cover Arrangement register (school operations).
//
// When a teacher is absent, every one of their periods must be covered. This durable register tracks
// each uncovered period → assigned substitute → completion, so a head teacher sees at a glance which
// periods are still uncovered today. Cross-wired with the Timetable Manager: the form can suggest the
// teachers who are FREE in that exact day+period (no clashing class). Pure, client-safe model.

import { CLASS_LEVELS, SECTIONS } from "@/lib/students"
import { SUBJECT_AREAS } from "@/lib/courses"

export { CLASS_LEVELS, SECTIONS, SUBJECT_AREAS }

export const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8] as const

export const COVER_REASONS = ["Casual Leave", "Medical Leave", "Training", "Official Duty", "Other"] as const
export type CoverReason = (typeof COVER_REASONS)[number]

export const COVER_STATUSES = ["Pending", "Assigned", "Completed"] as const
export type CoverStatus = (typeof COVER_STATUSES)[number]

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const

export function weekday(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`)
  return Number.isNaN(d.getTime()) ? "" : WEEKDAYS[d.getUTCDay()]
}

export interface CoverArrangement {
  id: string
  date: string
  absentTeacher: string
  reason: string
  classLevel: string
  section: string
  period: number
  subject: string
  substituteTeacher: string
  status: CoverStatus
  notes: string
  createdAt: string
  updatedAt: string
}

export interface CoverInput {
  date: string
  absentTeacher: string
  reason: string
  classLevel: string
  section: string
  period: number
  subject: string
  substituteTeacher: string
  status: CoverStatus
  notes: string
}

export function emptyCover(): CoverInput {
  return { date: new Date().toISOString().slice(0, 10), absentTeacher: "", reason: "Casual Leave", classLevel: "", section: "A", period: 1, subject: "Mathematics", substituteTeacher: "", status: "Pending", notes: "" }
}

/** Teachers from the roster who are NOT in the busy set (free in the slot). Pure. */
export function freeFrom(busy: string[], roster: string[]): string[] {
  const taken = new Set(busy.map((t) => t.trim().toLowerCase()))
  return roster.filter((t) => !taken.has(t.trim().toLowerCase())).sort()
}

export type CoverErrors = Partial<Record<keyof CoverInput, string>>

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function validateCover(f: CoverInput): { ok: boolean; errors: CoverErrors } {
  const e: CoverErrors = {}
  if (!DATE_RE.test(f.date.trim())) e.date = "Use a date like 2026-06-30"
  if (!f.absentTeacher.trim()) e.absentTeacher = "Absent teacher is required"
  if (!(COVER_REASONS as readonly string[]).includes(f.reason)) e.reason = "Select the reason"
  if (!(CLASS_LEVELS as readonly string[]).includes(f.classLevel)) e.classLevel = "Select the class"
  if (!(SECTIONS as readonly string[]).includes(f.section)) e.section = "Select the section"
  if (!Number.isInteger(f.period) || f.period < 1 || f.period > 8) e.period = "Period must be 1–8"
  if (!(SUBJECT_AREAS as readonly string[]).includes(f.subject)) e.subject = "Select the subject"
  if (!(COVER_STATUSES as readonly string[]).includes(f.status)) e.status = "Select a status"
  if (f.status !== "Pending" && !f.substituteTeacher.trim()) e.substituteTeacher = "Assign a substitute before marking assigned/completed"
  return { ok: Object.keys(e).length === 0, errors: e }
}

export interface CoverFilters {
  query?: string
  date?: string
  status?: string
  reason?: string
  sortBy?: "date" | "period"
  sortDir?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export interface CoverSummary {
  total: number
  pending: number
  assigned: number
  completed: number
}

export interface CoverPage {
  covers: CoverArrangement[]
  total: number
  totalPages: number
  page: number
  pageSize: number
  summary: CoverSummary
}

const DEFAULT_PAGE_SIZE = 10

export function coverSummary(all: CoverArrangement[]): CoverSummary {
  return {
    total: all.length,
    pending: all.filter((c) => c.status === "Pending").length,
    assigned: all.filter((c) => c.status === "Assigned").length,
    completed: all.filter((c) => c.status === "Completed").length,
  }
}

export function queryCovers(all: CoverArrangement[], f: CoverFilters = {}): CoverPage {
  const q = (f.query ?? "").trim().toLowerCase()
  const order: Record<CoverStatus, number> = { Pending: 0, Assigned: 1, Completed: 2 }
  let rows = all.filter((c) => {
    if (q && !(`${c.absentTeacher} ${c.substituteTeacher} ${c.subject}`.toLowerCase().includes(q))) return false
    if (f.date && c.date !== f.date) return false
    if (f.status && c.status !== f.status) return false
    if (f.reason && c.reason !== f.reason) return false
    return true
  })
  const summary = coverSummary(rows)
  const dir = f.sortDir === "asc" ? 1 : -1
  const by = f.sortBy ?? "date"
  rows = [...rows].sort((a, b) => {
    if (by === "period") return (a.period - b.period) * dir
    // by date: pending first, then by date desc
    return order[a.status] - order[b.status] || (a.date < b.date ? dir : a.date > b.date ? -dir : a.period - b.period)
  })
  const pageSize = f.pageSize && f.pageSize > 0 ? f.pageSize : DEFAULT_PAGE_SIZE
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, f.page ?? 1), totalPages)
  const start = (page - 1) * pageSize
  return { covers: rows.slice(start, start + pageSize), total, totalPages, page, pageSize, summary }
}
