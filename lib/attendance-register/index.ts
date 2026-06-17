// VASA-EOS(SE) — Attendance Register model + validation.
//
// A durable per-student daily attendance entry: who, which class/section, the date, a Present/
// Absent/Late/Leave status and an optional remark. Pure, client-safe model shared by the form, the
// list filters and the store. Full-CRUD module at Policies-grade depth — complements the existing
// daily marking sheet (lib/attendance) with a manageable, queryable register.

import { CLASS_LEVELS, SECTIONS } from "@/lib/students"

export { CLASS_LEVELS, SECTIONS }

export const ATTENDANCE_STATUSES = ["Present", "Absent", "Late", "Leave"] as const
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number]

/** Present + Late count as "attended" for the rate. */
export const ATTENDED_STATUSES: readonly AttendanceStatus[] = ["Present", "Late"]

export interface AttendanceEntry {
  id: string
  student: string
  apaarId: string
  classLevel: string
  section: string
  date: string
  status: AttendanceStatus
  remarks: string
  createdAt: string
  updatedAt: string
}

export interface AttendanceInput {
  student: string
  apaarId: string
  classLevel: string
  section: string
  date: string
  status: AttendanceStatus
  remarks: string
}

export function emptyAttendance(): AttendanceInput {
  return { student: "", apaarId: "", classLevel: "", section: "A", date: "", status: "Present", remarks: "" }
}

export type AttendanceErrors = Partial<Record<keyof AttendanceInput, string>>

const APAAR_RE = /^\d{12}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function validateAttendance(f: AttendanceInput): { ok: boolean; errors: AttendanceErrors } {
  const e: AttendanceErrors = {}
  if (!f.student.trim()) e.student = "Student name is required"
  if (f.apaarId.trim() && !APAAR_RE.test(f.apaarId.trim())) e.apaarId = "APAAR id must be 12 digits (or leave blank)"
  if (!(CLASS_LEVELS as readonly string[]).includes(f.classLevel)) e.classLevel = "Select the class"
  if (!(SECTIONS as readonly string[]).includes(f.section)) e.section = "Select the section"
  if (!DATE_RE.test(f.date.trim())) e.date = "Use a date like 2026-06-15"
  if (!(ATTENDANCE_STATUSES as readonly string[]).includes(f.status)) e.status = "Select a status"
  return { ok: Object.keys(e).length === 0, errors: e }
}

export interface AttendanceRate {
  total: number
  attended: number
  pct: number
}

/** Attendance rate over a set of entries: (Present + Late) / total, to one decimal. */
export function attendanceRate(entries: Pick<AttendanceEntry, "status">[]): AttendanceRate {
  const total = entries.length
  const attended = entries.filter((e) => ATTENDED_STATUSES.includes(e.status)).length
  const pct = total > 0 ? Math.round((attended / total) * 1000) / 10 : 0
  return { total, attended, pct }
}

export interface AttendanceFilters {
  query?: string
  status?: string
  classLevel?: string
  section?: string
  date?: string
  sortBy?: "student" | "date" | "createdAt"
  sortDir?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export interface AttendancePage {
  entries: AttendanceEntry[]
  total: number
  totalPages: number
  page: number
  pageSize: number
  rate: AttendanceRate
}

const DEFAULT_PAGE_SIZE = 10

export function queryAttendance(all: AttendanceEntry[], f: AttendanceFilters = {}): AttendancePage {
  const q = (f.query ?? "").trim().toLowerCase()
  let rows = all.filter((r) => {
    if (q && !(`${r.student} ${r.apaarId}`.toLowerCase().includes(q))) return false
    if (f.status && r.status !== f.status) return false
    if (f.classLevel && r.classLevel !== f.classLevel) return false
    if (f.section && r.section !== f.section) return false
    if (f.date && r.date !== f.date) return false
    return true
  })
  const rate = attendanceRate(rows) // rate reflects the current filter
  const dir = f.sortDir === "asc" ? 1 : -1
  const by = f.sortBy ?? "date"
  rows = [...rows].sort((a, b) => {
    const av = by === "student" ? a.student : by === "createdAt" ? a.createdAt : a.date
    const bv = by === "student" ? b.student : by === "createdAt" ? b.createdAt : b.date
    return av < bv ? -dir : av > bv ? dir : 0
  })
  const pageSize = f.pageSize && f.pageSize > 0 ? f.pageSize : DEFAULT_PAGE_SIZE
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, f.page ?? 1), totalPages)
  const start = (page - 1) * pageSize
  return { entries: rows.slice(start, start + pageSize), total, totalPages, page, pageSize, rate }
}
