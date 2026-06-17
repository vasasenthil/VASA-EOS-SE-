// VASA-EOS(SE) — Holiday Calendar model + validation (school operations).
//
// A durable, categorised holiday: name, category (National/State/Restricted/Local/Optional/Exam
// Break/Vacation/Special), an inclusive date range (multi-day vacations/breaks), an optional
// recurring-annual flag (fixed-date festivals), the academic year it belongs to, and a
// Confirmed/Tentative status. Pure, client-safe model shared by the form, the list filters and the
// store. Full-CRUD module at Policies-grade depth.
//
// INTEGRATION SEAM: holidaysOnDate()/isHoliday() are the lookup the Working-Time Scheduler uses to
// compute isWorkingDay(date); the Timetable and Lesson Plans then resolve real school days from it.

export const HOLIDAY_CATEGORIES = [
  "National",
  "State",
  "Restricted",
  "Local",
  "Optional",
  "Exam Break",
  "Vacation",
  "Special",
] as const
export type HolidayCategory = (typeof HOLIDAY_CATEGORIES)[number]

export const HOLIDAY_STATUSES = ["Confirmed", "Tentative"] as const
export type HolidayStatus = (typeof HOLIDAY_STATUSES)[number]

export interface Holiday {
  id: string
  name: string
  category: HolidayCategory
  startDate: string
  endDate: string
  recurring: boolean
  academicYear: string
  description: string
  status: HolidayStatus
  createdAt: string
  updatedAt: string
}

export interface HolidayInput {
  name: string
  category: HolidayCategory
  startDate: string
  endDate: string
  recurring: boolean
  academicYear: string
  description: string
  status: HolidayStatus
}

export function emptyHoliday(): HolidayInput {
  return { name: "", category: "National", startDate: "", endDate: "", recurring: false, academicYear: "2026-2027", description: "", status: "Confirmed" }
}

export type HolidayErrors = Partial<Record<keyof HolidayInput, string>>

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const AY_RE = /^\d{4}-\d{4}$/

export function validateHoliday(f: HolidayInput): { ok: boolean; errors: HolidayErrors } {
  const e: HolidayErrors = {}
  if (!f.name.trim()) e.name = "Holiday name is required"
  if (!(HOLIDAY_CATEGORIES as readonly string[]).includes(f.category)) e.category = "Select a category"
  if (!DATE_RE.test(f.startDate.trim())) e.startDate = "Use a date like 2026-08-15"
  if (!DATE_RE.test(f.endDate.trim())) e.endDate = "Use a date like 2026-08-15"
  else if (DATE_RE.test(f.startDate) && f.endDate < f.startDate) e.endDate = "End cannot be before start"
  if (!AY_RE.test(f.academicYear.trim())) e.academicYear = "Use an academic year like 2026-2027"
  else {
    const [a, b] = f.academicYear.split("-").map(Number)
    if (b !== a + 1) e.academicYear = "Academic year must be consecutive years (e.g. 2026-2027)"
  }
  if (!(HOLIDAY_STATUSES as readonly string[]).includes(f.status)) e.status = "Select a status"
  return { ok: Object.keys(e).length === 0, errors: e }
}

/** Inclusive number of days a holiday spans (min 1). */
export function holidayDays(h: Pick<Holiday, "startDate" | "endDate">): number {
  if (!DATE_RE.test(h.startDate) || !DATE_RE.test(h.endDate)) return 1
  const a = Date.parse(`${h.startDate}T00:00:00Z`)
  const b = Date.parse(`${h.endDate}T00:00:00Z`)
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return 1
  return Math.floor((b - a) / 86400000) + 1
}

function md(dateStr: string): string {
  return dateStr.slice(5) // "MM-DD"
}

/**
 * Whether `dateStr` (YYYY-MM-DD) falls within this holiday.
 * - non-recurring: full-date range [startDate, endDate].
 * - recurring (annual): compare month-day within [start MM-DD, end MM-DD], any year.
 */
export function dateInHoliday(h: Pick<Holiday, "startDate" | "endDate" | "recurring">, dateStr: string): boolean {
  if (!DATE_RE.test(dateStr) || !DATE_RE.test(h.startDate) || !DATE_RE.test(h.endDate)) return false
  if (!h.recurring) return dateStr >= h.startDate && dateStr <= h.endDate
  const d = md(dateStr)
  const s = md(h.startDate)
  const e = md(h.endDate)
  return s <= e ? d >= s && d <= e : d >= s || d <= e // year-wrapping ranges (e.g. Dec–Jan)
}

/** All holidays covering a date (INTEGRATION SEAM for the Working-Time Scheduler). */
export function holidaysOnDate(all: Holiday[], dateStr: string): Holiday[] {
  return all.filter((h) => dateInHoliday(h, dateStr))
}

export function isHoliday(all: Holiday[], dateStr: string): boolean {
  return all.some((h) => dateInHoliday(h, dateStr))
}

export interface HolidayFilters {
  query?: string
  category?: string
  academicYear?: string
  month?: string // "01".."12" (matched against the start month)
  status?: string
  sortBy?: "startDate" | "name" | "createdAt"
  sortDir?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export interface HolidayPage {
  holidays: Holiday[]
  total: number
  totalPages: number
  page: number
  pageSize: number
  totalDays: number
}

const DEFAULT_PAGE_SIZE = 10

export function queryHolidays(all: Holiday[], f: HolidayFilters = {}): HolidayPage {
  const q = (f.query ?? "").trim().toLowerCase()
  let rows = all.filter((h) => {
    if (q && !(`${h.name} ${h.description}`.toLowerCase().includes(q))) return false
    if (f.category && h.category !== f.category) return false
    if (f.academicYear && h.academicYear !== f.academicYear) return false
    if (f.month && h.startDate.slice(5, 7) !== f.month) return false
    if (f.status && h.status !== f.status) return false
    return true
  })
  const totalDays = rows.reduce((s, h) => s + holidayDays(h), 0)
  const dir = f.sortDir === "asc" ? 1 : -1
  const by = f.sortBy ?? "startDate"
  rows = [...rows].sort((a, b) => {
    const av = by === "name" ? a.name : by === "createdAt" ? a.createdAt : a.startDate
    const bv = by === "name" ? b.name : by === "createdAt" ? b.createdAt : b.startDate
    return av < bv ? -dir : av > bv ? dir : 0
  })
  const pageSize = f.pageSize && f.pageSize > 0 ? f.pageSize : DEFAULT_PAGE_SIZE
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, f.page ?? 1), totalPages)
  const start = (page - 1) * pageSize
  return { holidays: rows.slice(start, start + pageSize), total, totalPages, page, pageSize, totalDays }
}
