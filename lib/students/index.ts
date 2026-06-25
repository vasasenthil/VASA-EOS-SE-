// VASA-EOS(SE) — Student Records (SIS) model + validation.
//
// The student master record: APAAR id, name, demographics, class/section, guardian and contact,
// with an enrolment lifecycle. Pure, client-safe model shared by the create/edit form, the list
// filters and the store. Full-CRUD module at Policies-grade depth. Complements lib/sis (the static
// illustrative roster) with a durable, manageable register.

import { CLASS_LEVELS } from "@/lib/courses"

export { CLASS_LEVELS }

export const GENDERS = ["Male", "Female", "Other"] as const
export type Gender = (typeof GENDERS)[number]

// Tamil Nadu social categories.
export const CATEGORIES = ["OC", "BC", "BCM", "MBC", "SC", "SCA", "ST"] as const
export type Category = (typeof CATEGORIES)[number]

export const SECTIONS = ["A", "B", "C", "D", "E"] as const
export type Section = (typeof SECTIONS)[number]

export const STUDENT_STATUSES = ["Enrolled", "Transferred", "Graduated", "Dropped"] as const
export type StudentStatus = (typeof STUDENT_STATUSES)[number]

export interface StudentRecord {
  id: string
  apaarId: string
  name: string
  gender: string
  dob: string
  classLevel: string
  section: string
  category: string
  guardianName: string
  contactPhone: string
  status: StudentStatus
  createdAt: string
  updatedAt: string
}

export interface StudentInput {
  apaarId: string
  name: string
  gender: string
  dob: string
  classLevel: string
  section: string
  category: string
  guardianName: string
  contactPhone: string
  status: StudentStatus
}

export function emptyStudent(): StudentInput {
  return { apaarId: "", name: "", gender: "", dob: "", classLevel: "", section: "A", category: "", guardianName: "", contactPhone: "", status: "Enrolled" }
}

export type StudentErrors = Partial<Record<keyof StudentInput, string>>

const APAAR_RE = /^\d{12}$/
const PHONE_RE = /^\d{10}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** Age in whole years at a reference date; -1 for an invalid/missing dob. */
export function ageYears(dob: string, asOf: Date = new Date()): number {
  if (!DATE_RE.test(dob)) return -1
  const d = new Date(`${dob}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return -1
  let age = asOf.getUTCFullYear() - d.getUTCFullYear()
  const m = asOf.getUTCMonth() - d.getUTCMonth()
  if (m < 0 || (m === 0 && asOf.getUTCDate() < d.getUTCDate())) age--
  return age
}

export function validateStudent(f: StudentInput): { ok: boolean; errors: StudentErrors } {
  const e: StudentErrors = {}
  if (!APAAR_RE.test(f.apaarId.trim())) e.apaarId = "APAAR id must be 12 digits"
  if (!f.name.trim()) e.name = "Student name is required"
  if (!(GENDERS as readonly string[]).includes(f.gender)) e.gender = "Select the gender"
  if (!DATE_RE.test(f.dob.trim())) e.dob = "Use a date like 2014-05-30"
  else {
    const age = ageYears(f.dob)
    if (age < 2 || age > 25) e.dob = "Date of birth looks out of range"
  }
  if (!(CLASS_LEVELS as readonly string[]).includes(f.classLevel)) e.classLevel = "Select the class"
  if (!(SECTIONS as readonly string[]).includes(f.section)) e.section = "Select the section"
  if (!(CATEGORIES as readonly string[]).includes(f.category)) e.category = "Select the category"
  if (!f.guardianName.trim()) e.guardianName = "Guardian name is required"
  if (!PHONE_RE.test(f.contactPhone.trim())) e.contactPhone = "Contact must be a 10-digit number"
  if (!(STUDENT_STATUSES as readonly string[]).includes(f.status)) e.status = "Select a status"
  return { ok: Object.keys(e).length === 0, errors: e }
}

export interface StudentFilters {
  query?: string
  status?: string
  classLevel?: string
  section?: string
  category?: string
  sortBy?: "name" | "createdAt" | "classLevel"
  sortDir?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export interface StudentPage {
  students: StudentRecord[]
  total: number
  totalPages: number
  page: number
  pageSize: number
}

const DEFAULT_PAGE_SIZE = 10

export function queryStudents(all: StudentRecord[], f: StudentFilters = {}): StudentPage {
  const q = (f.query ?? "").trim().toLowerCase()
  let rows = all.filter((s) => {
    if (q && !(`${s.name} ${s.apaarId} ${s.guardianName}`.toLowerCase().includes(q))) return false
    if (f.status && s.status !== f.status) return false
    if (f.classLevel && s.classLevel !== f.classLevel) return false
    if (f.section && s.section !== f.section) return false
    if (f.category && s.category !== f.category) return false
    return true
  })
  const dir = f.sortDir === "asc" ? 1 : -1
  const by = f.sortBy ?? "createdAt"
  rows = [...rows].sort((a, b) => {
    const av = by === "name" ? a.name : by === "classLevel" ? a.classLevel : a.createdAt
    const bv = by === "name" ? b.name : by === "classLevel" ? b.classLevel : b.createdAt
    return av < bv ? -dir : av > bv ? dir : 0
  })
  const pageSize = f.pageSize && f.pageSize > 0 ? f.pageSize : DEFAULT_PAGE_SIZE
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, f.page ?? 1), totalPages)
  const start = (page - 1) * pageSize
  return { students: rows.slice(start, start + pageSize), total, totalPages, page, pageSize }
}
