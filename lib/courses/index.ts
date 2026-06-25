// VASA-EOS(SE) — Course catalogue model + validation (Academic & Assessment).
//
// The academic course catalogue: the subjects/courses a school offers per class, with a teacher,
// credits and a lifecycle status. This is the pure, client-safe model + validation shared by the
// create/edit forms, the list filters and the store. Full-CRUD module (list → create → view →
// edit → delete → seed) built to the Policies-grade depth standard.

export const COURSE_STATUSES = ["Active", "Draft", "Archived"] as const
export type CourseStatus = (typeof COURSE_STATUSES)[number]

export const CLASS_LEVELS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"] as const
export type ClassLevel = (typeof CLASS_LEVELS)[number]

export const SUBJECT_AREAS = [
  "Tamil",
  "English",
  "Mathematics",
  "Science",
  "Social Science",
  "Computer Science",
  "Physical Education",
  "Arts & Culture",
] as const
export type SubjectArea = (typeof SUBJECT_AREAS)[number]

export interface Course {
  id: string
  code: string
  name: string
  classLevel: string
  subjectArea: string
  description: string
  credits: number
  teacher: string
  status: CourseStatus
  createdAt: string
  updatedAt: string
}

export interface CourseInput {
  code: string
  name: string
  classLevel: string
  subjectArea: string
  description: string
  credits: number
  teacher: string
  status: CourseStatus
}

export function emptyCourse(): CourseInput {
  return { code: "", name: "", classLevel: "", subjectArea: "", description: "", credits: 4, teacher: "", status: "Draft" }
}

export type CourseErrors = Partial<Record<keyof CourseInput, string>>

const CODE_RE = /^[A-Z]{2,4}-(?:I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)$/
const MIN_DESC = 10

export function validateCourse(f: CourseInput): { ok: boolean; errors: CourseErrors } {
  const e: CourseErrors = {}
  if (!CODE_RE.test(f.code.trim())) e.code = "Code like MAT-X (subject prefix + class)"
  if (!f.name.trim()) e.name = "Course name is required"
  if (!(CLASS_LEVELS as readonly string[]).includes(f.classLevel)) e.classLevel = "Select the class"
  if (!(SUBJECT_AREAS as readonly string[]).includes(f.subjectArea)) e.subjectArea = "Select the subject area"
  if (f.description.trim().length < MIN_DESC) e.description = `Add a short description (min ${MIN_DESC} characters)`
  if (!Number.isFinite(f.credits) || f.credits < 1 || f.credits > 10) e.credits = "Credits must be between 1 and 10"
  if (!f.teacher.trim()) e.teacher = "Assign a teacher"
  if (!(COURSE_STATUSES as readonly string[]).includes(f.status)) e.status = "Select a status"
  return { ok: Object.keys(e).length === 0, errors: e }
}

export interface CourseFilters {
  query?: string
  status?: string
  classLevel?: string
  sortBy?: "name" | "code" | "createdAt"
  sortDir?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export interface CoursePage {
  courses: Course[]
  total: number
  totalPages: number
  page: number
  pageSize: number
}

const DEFAULT_PAGE_SIZE = 9

/** Pure filter + sort + paginate over a course set (same maths in tests and the server). */
export function queryCourses(all: Course[], f: CourseFilters = {}): CoursePage {
  const q = (f.query ?? "").trim().toLowerCase()
  let rows = all.filter((c) => {
    if (q && !(`${c.name} ${c.code} ${c.teacher}`.toLowerCase().includes(q))) return false
    if (f.status && c.status !== f.status) return false
    if (f.classLevel && c.classLevel !== f.classLevel) return false
    return true
  })
  const dir = f.sortDir === "asc" ? 1 : -1
  const by = f.sortBy ?? "createdAt"
  rows = [...rows].sort((a, b) => {
    const av = by === "createdAt" ? a.createdAt : by === "code" ? a.code : a.name
    const bv = by === "createdAt" ? b.createdAt : by === "code" ? b.code : b.name
    return av < bv ? -dir : av > bv ? dir : 0
  })
  const pageSize = f.pageSize && f.pageSize > 0 ? f.pageSize : DEFAULT_PAGE_SIZE
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, f.page ?? 1), totalPages)
  const start = (page - 1) * pageSize
  return { courses: rows.slice(start, start + pageSize), total, totalPages, page, pageSize }
}
