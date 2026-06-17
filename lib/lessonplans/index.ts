// VASA-EOS(SE) — Lesson Plans model + validation (Academic & classroom delivery).
//
// A rich per-period lesson plan for one class session: scheduling (class/section, subject, teacher,
// date, period, start/end time → duration), pedagogy (lesson type, current topic, previously studied
// topics, further/upcoming topics, objectives), and resources (lesson-planner link, what students
// must bring, homework, and class notes as audio/video/document links). Pure, client-safe model
// shared by the form, the list filters and the store. Full-CRUD module at Policies-grade depth — the
// richest classroom artefact. Complements the basic Timetable Manager (lib/timetable-manager).

import { CLASS_LEVELS, SECTIONS } from "@/lib/students"
import { SUBJECT_AREAS } from "@/lib/courses"

export { CLASS_LEVELS, SECTIONS, SUBJECT_AREAS }

export const LESSON_TYPES = ["Theory", "Practical", "Field Work", "Project", "Activity", "Revision"] as const
export type LessonType = (typeof LESSON_TYPES)[number]

export const LESSON_STATUSES = ["Draft", "Planned", "Delivered"] as const
export type LessonStatus = (typeof LESSON_STATUSES)[number]

export const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8] as const

export const RESOURCE_KINDS = ["Audio", "Video", "Document", "Link"] as const
export type ResourceKind = (typeof RESOURCE_KINDS)[number]

export interface ResourceLink {
  kind: ResourceKind
  title: string
  url: string
}

export interface LessonPlan {
  id: string
  classLevel: string
  section: string
  subject: string
  teacher: string
  date: string
  period: number
  startTime: string
  endTime: string
  lessonType: LessonType
  topic: string
  objectives: string
  previousTopics: string[]
  furtherTopics: string[]
  materialsToBring: string[]
  homework: string
  lessonPlannerLink: string
  classNotes: ResourceLink[]
  status: LessonStatus
  createdAt: string
  updatedAt: string
}

export interface LessonPlanInput {
  classLevel: string
  section: string
  subject: string
  teacher: string
  date: string
  period: number
  startTime: string
  endTime: string
  lessonType: LessonType
  topic: string
  objectives: string
  previousTopics: string[]
  furtherTopics: string[]
  materialsToBring: string[]
  homework: string
  lessonPlannerLink: string
  classNotes: ResourceLink[]
  status: LessonStatus
}

export function emptyLessonPlan(): LessonPlanInput {
  return {
    classLevel: "", section: "A", subject: "", teacher: "", date: "", period: 1, startTime: "09:00", endTime: "09:45",
    lessonType: "Theory", topic: "", objectives: "", previousTopics: [], furtherTopics: [], materialsToBring: [],
    homework: "", lessonPlannerLink: "", classNotes: [], status: "Draft",
  }
}

/** Parse a comma/newline separated string into a clean list (trim, drop empties, dedupe). */
export function parseList(text: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of text.split(/[\n,]/)) {
    const t = raw.trim()
    if (t && !seen.has(t.toLowerCase())) {
      seen.add(t.toLowerCase())
      out.push(t)
    }
  }
  return out
}

/** Lesson duration in whole minutes; 0 for invalid times. */
export function durationMinutes(startTime: string, endTime: string): number {
  const m = (t: string) => {
    const x = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(t)
    return x ? Number(x[1]) * 60 + Number(x[2]) : NaN
  }
  const a = m(startTime)
  const b = m(endTime)
  return Number.isFinite(a) && Number.isFinite(b) && b > a ? b - a : 0
}

export type LessonPlanErrors = Partial<Record<keyof LessonPlanInput, string>>

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const URL_RE = /^https?:\/\/\S+$/i

export function isValidUrl(u: string): boolean {
  return URL_RE.test(u.trim())
}

export function validateLessonPlan(f: LessonPlanInput): { ok: boolean; errors: LessonPlanErrors } {
  const e: LessonPlanErrors = {}
  if (!(CLASS_LEVELS as readonly string[]).includes(f.classLevel)) e.classLevel = "Select the class"
  if (!(SECTIONS as readonly string[]).includes(f.section)) e.section = "Select the section"
  if (!(SUBJECT_AREAS as readonly string[]).includes(f.subject)) e.subject = "Select the subject"
  if (!f.teacher.trim()) e.teacher = "Assign a teacher"
  if (!DATE_RE.test(f.date.trim())) e.date = "Use a date like 2026-06-30"
  if (!Number.isInteger(f.period) || f.period < 1 || f.period > 8) e.period = "Period must be 1–8"
  if (!TIME_RE.test(f.startTime)) e.startTime = "Use a time like 09:00"
  if (!TIME_RE.test(f.endTime)) e.endTime = "Use a time like 09:45"
  else if (TIME_RE.test(f.startTime) && f.endTime <= f.startTime) e.endTime = "End must be after start"
  if (!(LESSON_TYPES as readonly string[]).includes(f.lessonType)) e.lessonType = "Select the lesson type"
  if (!f.topic.trim()) e.topic = "Enter the lesson topic"
  if (!(LESSON_STATUSES as readonly string[]).includes(f.status)) e.status = "Select a status"
  if (f.lessonPlannerLink.trim() && !isValidUrl(f.lessonPlannerLink)) e.lessonPlannerLink = "Enter a valid http(s) URL"
  if (f.classNotes.some((n) => !n.title.trim() || !isValidUrl(n.url) || !(RESOURCE_KINDS as readonly string[]).includes(n.kind))) {
    e.classNotes = "Each class note needs a title and a valid http(s) URL"
  }
  return { ok: Object.keys(e).length === 0, errors: e }
}

export interface LessonPlanFilters {
  query?: string
  status?: string
  classLevel?: string
  section?: string
  subject?: string
  lessonType?: string
  date?: string
  sortBy?: "date" | "createdAt" | "topic"
  sortDir?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export interface LessonPlanPage {
  plans: LessonPlan[]
  total: number
  totalPages: number
  page: number
  pageSize: number
}

const DEFAULT_PAGE_SIZE = 9

export function queryLessonPlans(all: LessonPlan[], f: LessonPlanFilters = {}): LessonPlanPage {
  const q = (f.query ?? "").trim().toLowerCase()
  let rows = all.filter((p) => {
    if (q && !(`${p.topic} ${p.teacher} ${p.subject}`.toLowerCase().includes(q))) return false
    if (f.status && p.status !== f.status) return false
    if (f.classLevel && p.classLevel !== f.classLevel) return false
    if (f.section && p.section !== f.section) return false
    if (f.subject && p.subject !== f.subject) return false
    if (f.lessonType && p.lessonType !== f.lessonType) return false
    if (f.date && p.date !== f.date) return false
    return true
  })
  const dir = f.sortDir === "asc" ? 1 : -1
  const by = f.sortBy ?? "date"
  rows = [...rows].sort((a, b) => {
    const av = by === "topic" ? a.topic : by === "createdAt" ? a.createdAt : a.date
    const bv = by === "topic" ? b.topic : by === "createdAt" ? b.createdAt : b.date
    return av < bv ? -dir : av > bv ? dir : 0
  })
  const pageSize = f.pageSize && f.pageSize > 0 ? f.pageSize : DEFAULT_PAGE_SIZE
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, f.page ?? 1), totalPages)
  const start = (page - 1) * pageSize
  return { plans: rows.slice(start, start + pageSize), total, totalPages, page, pageSize }
}
