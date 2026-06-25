// VASA-EOS(SE) — Timetable Manager model + validation (school operations).
//
// A durable per-period timetable entry: class/section, day, period, time window, subject, teacher
// and room. Pure, client-safe model shared by the form, the list filters and the store. Full-CRUD
// module at Policies-grade depth, with clash detection (a teacher or a class can't be double-booked
// in the same day+period). Complements the existing substitution-grid board (lib/timetable).

import { CLASS_LEVELS, SECTIONS } from "@/lib/students"
import { SUBJECT_AREAS } from "@/lib/courses"

export { CLASS_LEVELS, SECTIONS, SUBJECT_AREAS }

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const
export type Day = (typeof DAYS)[number]

export const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8] as const

export interface TimetableEntry {
  id: string
  classLevel: string
  section: string
  day: string
  period: number
  startTime: string
  endTime: string
  subject: string
  teacher: string
  room: string
  createdAt: string
  updatedAt: string
}

export interface TimetableInput {
  classLevel: string
  section: string
  day: string
  period: number
  startTime: string
  endTime: string
  subject: string
  teacher: string
  room: string
}

export function emptyTimetableEntry(): TimetableInput {
  return { classLevel: "", section: "A", day: "Monday", period: 1, startTime: "09:00", endTime: "09:45", subject: "", teacher: "", room: "" }
}

export type TimetableErrors = Partial<Record<keyof TimetableInput, string>>

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

export function validateTimetable(f: TimetableInput): { ok: boolean; errors: TimetableErrors } {
  const e: TimetableErrors = {}
  if (!(CLASS_LEVELS as readonly string[]).includes(f.classLevel)) e.classLevel = "Select the class"
  if (!(SECTIONS as readonly string[]).includes(f.section)) e.section = "Select the section"
  if (!(DAYS as readonly string[]).includes(f.day)) e.day = "Select the day"
  if (!Number.isInteger(f.period) || f.period < 1 || f.period > 8) e.period = "Period must be 1–8"
  if (!TIME_RE.test(f.startTime)) e.startTime = "Use a time like 09:00"
  if (!TIME_RE.test(f.endTime)) e.endTime = "Use a time like 09:45"
  else if (TIME_RE.test(f.startTime) && f.endTime <= f.startTime) e.endTime = "End must be after start"
  if (!(SUBJECT_AREAS as readonly string[]).includes(f.subject)) e.subject = "Select the subject"
  if (!f.teacher.trim()) e.teacher = "Assign a teacher"
  if (!f.room.trim()) e.room = "Enter the room"
  return { ok: Object.keys(e).length === 0, errors: e }
}

/**
 * Entries that clash with `candidate`: same day + period and either the same class+section
 * (a class can't be in two places) or the same teacher (a teacher can't be in two places).
 * `excludeId` skips the entry being edited.
 */
export function findClashes(all: TimetableEntry[], candidate: TimetableInput, excludeId?: string): TimetableEntry[] {
  return all.filter((e) => {
    if (excludeId && e.id === excludeId) return false
    if (e.day !== candidate.day || e.period !== candidate.period) return false
    const sameClass = e.classLevel === candidate.classLevel && e.section === candidate.section
    const sameTeacher = e.teacher.trim().toLowerCase() === candidate.teacher.trim().toLowerCase()
    return sameClass || sameTeacher
  })
}

export function describeClash(clash: TimetableEntry, candidate: TimetableInput): string {
  const sameClass = clash.classLevel === candidate.classLevel && clash.section === candidate.section
  return sameClass
    ? `Class ${clash.classLevel}-${clash.section} already has ${clash.subject} in period ${clash.period} on ${clash.day}.`
    : `${clash.teacher} is already teaching ${clash.classLevel}-${clash.section} in period ${clash.period} on ${clash.day}.`
}

export interface TimetableFilters {
  query?: string
  classLevel?: string
  section?: string
  day?: string
  subject?: string
  sortBy?: "day" | "period" | "createdAt"
  sortDir?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export interface TimetablePage {
  entries: TimetableEntry[]
  total: number
  totalPages: number
  page: number
  pageSize: number
}

const DAY_ORDER: Record<string, number> = Object.fromEntries(DAYS.map((d, i) => [d, i]))
const DEFAULT_PAGE_SIZE = 12

export function queryTimetable(all: TimetableEntry[], f: TimetableFilters = {}): TimetablePage {
  const q = (f.query ?? "").trim().toLowerCase()
  let rows = all.filter((e) => {
    if (q && !(`${e.teacher} ${e.room} ${e.subject}`.toLowerCase().includes(q))) return false
    if (f.classLevel && e.classLevel !== f.classLevel) return false
    if (f.section && e.section !== f.section) return false
    if (f.day && e.day !== f.day) return false
    if (f.subject && e.subject !== f.subject) return false
    return true
  })
  const dir = f.sortDir === "asc" ? 1 : -1
  const by = f.sortBy ?? "day"
  rows = [...rows].sort((a, b) => {
    if (by === "createdAt") return a.createdAt < b.createdAt ? -dir : a.createdAt > b.createdAt ? dir : 0
    if (by === "period") return (a.period - b.period) * dir
    // by day: order by weekday then period
    const da = DAY_ORDER[a.day] ?? 99
    const db = DAY_ORDER[b.day] ?? 99
    return da !== db ? (da - db) * dir : (a.period - b.period) * dir
  })
  const pageSize = f.pageSize && f.pageSize > 0 ? f.pageSize : DEFAULT_PAGE_SIZE
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, f.page ?? 1), totalPages)
  const start = (page - 1) * pageSize
  return { entries: rows.slice(start, start + pageSize), total, totalPages, page, pageSize }
}
