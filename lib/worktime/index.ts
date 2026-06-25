// VASA-EOS(SE) — Working-Time Scheduler model, validation + school-day resolver.
//
// A working-time profile for one academic year: the yearly term window, the working weekdays
// (weekly pattern), the daily start/end, and the daily bell-schedule (periods, breaks, assembly).
// Pure, client-safe. Full-CRUD module at Policies-grade depth.
//
// INTEGRATION (executes the chain): resolveSchoolDay()/isWorkingDay() combine this profile with the
// Holiday Calendar (lib/holidays) to decide whether a given date is a real school day —
//   isWorkingDay(date) = within term · working weekday · NOT a holiday
// The Timetable resolves period times from the bell-schedule here; Lesson Plans are only valid on a
// resolved working day. workingDaysInRange()/monthWorkingDays() drive yearly/monthly/daily views.

import { holidaysOnDate, type Holiday } from "@/lib/holidays"

export const WORKTIME_STATUSES = ["Draft", "Active"] as const
export type WorkTimeStatus = (typeof WORKTIME_STATUSES)[number]

export const PERIOD_KINDS = ["Period", "Break", "Assembly"] as const
export type PeriodKind = (typeof PERIOD_KINDS)[number]

export const WEEKDAYS: { n: number; label: string; short: string }[] = [
  { n: 0, label: "Sunday", short: "Sun" },
  { n: 1, label: "Monday", short: "Mon" },
  { n: 2, label: "Tuesday", short: "Tue" },
  { n: 3, label: "Wednesday", short: "Wed" },
  { n: 4, label: "Thursday", short: "Thu" },
  { n: 5, label: "Friday", short: "Fri" },
  { n: 6, label: "Saturday", short: "Sat" },
]

export interface BellPeriod {
  label: string
  kind: PeriodKind
  startTime: string
  endTime: string
}

export interface WorkTimeProfile {
  id: string
  name: string
  academicYear: string
  termStart: string
  termEnd: string
  workingWeekdays: number[]
  dayStart: string
  dayEnd: string
  periods: BellPeriod[]
  status: WorkTimeStatus
  createdAt: string
  updatedAt: string
}

export interface WorkTimeInput {
  name: string
  academicYear: string
  termStart: string
  termEnd: string
  workingWeekdays: number[]
  dayStart: string
  dayEnd: string
  periods: BellPeriod[]
  status: WorkTimeStatus
}

export function emptyWorkTime(): WorkTimeInput {
  return {
    name: "", academicYear: "2026-2027", termStart: "2026-06-01", termEnd: "2027-04-30",
    workingWeekdays: [1, 2, 3, 4, 5, 6], dayStart: "09:00", dayEnd: "16:15",
    periods: [{ label: "Period 1", kind: "Period", startTime: "09:00", endTime: "09:45" }], status: "Draft",
  }
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const AY_RE = /^\d{4}-\d{4}$/

function toMin(t: string): number {
  const m = TIME_RE.exec(t)
  return m ? Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)) : NaN
}

/** Minutes in a single period (0 for invalid). */
export function periodMinutes(p: Pick<BellPeriod, "startTime" | "endTime">): number {
  const a = toMin(p.startTime)
  const b = toMin(p.endTime)
  return Number.isFinite(a) && Number.isFinite(b) && b > a ? b - a : 0
}

/** Total instructional minutes per day (kind === "Period" only). */
export function instructionalMinutes(periods: BellPeriod[]): number {
  return periods.filter((p) => p.kind === "Period").reduce((s, p) => s + periodMinutes(p), 0)
}

/** Whether any two periods overlap in time. */
export function periodsOverlap(periods: BellPeriod[]): boolean {
  const valid = periods.filter((p) => periodMinutes(p) > 0).map((p) => [toMin(p.startTime), toMin(p.endTime)] as const).sort((a, b) => a[0] - b[0])
  for (let i = 1; i < valid.length; i++) if (valid[i][0] < valid[i - 1][1]) return true
  return false
}

export type WorkTimeErrors = Partial<Record<keyof WorkTimeInput, string>>

export function validateWorkTime(f: WorkTimeInput): { ok: boolean; errors: WorkTimeErrors } {
  const e: WorkTimeErrors = {}
  if (!f.name.trim()) e.name = "Profile name is required"
  if (!AY_RE.test(f.academicYear.trim())) e.academicYear = "Use an academic year like 2026-2027"
  else {
    const [a, b] = f.academicYear.split("-").map(Number)
    if (b !== a + 1) e.academicYear = "Academic year must be consecutive (e.g. 2026-2027)"
  }
  if (!DATE_RE.test(f.termStart)) e.termStart = "Use a date like 2026-06-01"
  if (!DATE_RE.test(f.termEnd)) e.termEnd = "Use a date like 2027-04-30"
  else if (DATE_RE.test(f.termStart) && f.termEnd <= f.termStart) e.termEnd = "Term end must be after start"
  if (!Array.isArray(f.workingWeekdays) || f.workingWeekdays.length === 0) e.workingWeekdays = "Select at least one working weekday"
  if (!TIME_RE.test(f.dayStart)) e.dayStart = "Use a time like 09:00"
  if (!TIME_RE.test(f.dayEnd)) e.dayEnd = "Use a time like 16:15"
  else if (TIME_RE.test(f.dayStart) && f.dayEnd <= f.dayStart) e.dayEnd = "Day end must be after start"
  if (!Array.isArray(f.periods) || f.periods.length === 0) {
    e.periods = "Add at least one period"
  } else if (f.periods.some((p) => !p.label.trim() || !(PERIOD_KINDS as readonly string[]).includes(p.kind) || periodMinutes(p) <= 0)) {
    e.periods = "Each row needs a label, kind and valid start/end times"
  } else if (periodsOverlap(f.periods)) {
    e.periods = "Periods overlap in time — adjust the bell schedule"
  }
  if (!(WORKTIME_STATUSES as readonly string[]).includes(f.status)) e.status = "Select a status"
  return { ok: Object.keys(e).length === 0, errors: e }
}

export function dayOfWeek(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay()
}

export interface SchoolDay {
  date: string
  working: boolean
  reason: string
  holidayName?: string
  periods: BellPeriod[]
}

/**
 * Resolve whether a date is a real school day for this profile, consulting the Holiday Calendar.
 * INTEGRATION SEAM joining Working-Time + Holidays (used by Timetable/Lesson-Plan day views).
 */
export function resolveSchoolDay(profile: WorkTimeProfile, holidays: Holiday[], dateStr: string): SchoolDay {
  if (!DATE_RE.test(dateStr)) return { date: dateStr, working: false, reason: "Invalid date", periods: [] }
  if (dateStr < profile.termStart || dateStr > profile.termEnd) {
    return { date: dateStr, working: false, reason: "Outside the academic year", periods: [] }
  }
  const dow = dayOfWeek(dateStr)
  if (!profile.workingWeekdays.includes(dow)) {
    return { date: dateStr, working: false, reason: `Weekly off (${WEEKDAYS[dow]?.label ?? "—"})`, periods: [] }
  }
  const hols = holidaysOnDate(holidays, dateStr)
  if (hols.length > 0) {
    return { date: dateStr, working: false, reason: `Holiday: ${hols[0].name}`, holidayName: hols[0].name, periods: [] }
  }
  return { date: dateStr, working: true, reason: "Working day", periods: profile.periods }
}

export function isWorkingDay(profile: WorkTimeProfile, holidays: Holiday[], dateStr: string): boolean {
  return resolveSchoolDay(profile, holidays, dateStr).working
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export interface RangeSummary {
  total: number
  working: number
  holidays: number
  weeklyOff: number
  instructionalMinutes: number
}

/** Summarise a date range (capped at 400 days) into working/holiday/weekly-off counts. */
export function workingDaysInRange(profile: WorkTimeProfile, holidays: Holiday[], startStr: string, endStr: string): RangeSummary {
  const out: RangeSummary = { total: 0, working: 0, holidays: 0, weeklyOff: 0, instructionalMinutes: 0 }
  if (!DATE_RE.test(startStr) || !DATE_RE.test(endStr) || endStr < startStr) return out
  const perDay = instructionalMinutes(profile.periods)
  let cur = startStr
  for (let i = 0; i < 400 && cur <= endStr; i++, cur = addDays(cur, 1)) {
    out.total++
    const d = resolveSchoolDay(profile, holidays, cur)
    if (d.working) { out.working++; out.instructionalMinutes += perDay }
    else if (d.holidayName) out.holidays++
    else if (d.reason.startsWith("Weekly off")) out.weeklyOff++
  }
  return out
}

/** Resolve every day of a month into a SchoolDay (for the monthly/daily scheduler view). */
export function monthWorkingDays(profile: WorkTimeProfile, holidays: Holiday[], year: number, month: number): SchoolDay[] {
  const days: SchoolDay[] = []
  const dim = new Date(Date.UTC(year, month, 0)).getUTCDate() // month is 1-based here
  for (let d = 1; d <= dim; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    days.push(resolveSchoolDay(profile, holidays, dateStr))
  }
  return days
}

export interface WorkTimeFilters {
  query?: string
  academicYear?: string
  status?: string
  page?: number
  pageSize?: number
}

export interface WorkTimePage {
  profiles: WorkTimeProfile[]
  total: number
  totalPages: number
  page: number
  pageSize: number
}

const DEFAULT_PAGE_SIZE = 10

export function queryWorkTime(all: WorkTimeProfile[], f: WorkTimeFilters = {}): WorkTimePage {
  const q = (f.query ?? "").trim().toLowerCase()
  const rows = all.filter((p) => {
    if (q && !p.name.toLowerCase().includes(q)) return false
    if (f.academicYear && p.academicYear !== f.academicYear) return false
    if (f.status && p.status !== f.status) return false
    return true
  }).sort((a, b) => (a.academicYear < b.academicYear ? 1 : a.academicYear > b.academicYear ? -1 : 0))
  const pageSize = f.pageSize && f.pageSize > 0 ? f.pageSize : DEFAULT_PAGE_SIZE
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, f.page ?? 1), totalPages)
  const start = (page - 1) * pageSize
  return { profiles: rows.slice(start, start + pageSize), total, totalPages, page, pageSize }
}
