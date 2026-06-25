// VASA-EOS(SE) — Staff Master / HR Directory model + validation (HR).
//
// One record per staff member: identity (staff id, name), role (designation, cadre, department),
// demographics, joining/qualification, contact, employment type and service status, plus leave
// balances and pay scale. Pure, client-safe model shared by the form, the list filters and the
// store. Derived service years, age and retirement-due flag. Full-CRUD module at Policies-grade
// depth. Complements lib/staff (background-verification + transfer), lib/leave and lib/staff-attendance.

export const DESIGNATIONS = [
  "Headmaster / Principal",
  "Post Graduate Teacher (PGT)",
  "Graduate Teacher (BT)",
  "Secondary Grade Teacher (SGT)",
  "Physical Education Teacher",
  "Special Teacher",
  "Lab Assistant",
  "Librarian",
  "Office Assistant / Clerk",
  "Office Superintendent",
] as const
export type Designation = (typeof DESIGNATIONS)[number]

export const CADRES = ["Teaching", "Non-teaching", "Administrative"] as const
export type Cadre = (typeof CADRES)[number]

export const EMPLOYMENT_TYPES = ["Permanent", "Contract", "Guest", "Deputation"] as const
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number]

export const STAFF_STATUSES = ["Active", "On Leave", "Transferred", "Retired", "Suspended"] as const
export type StaffStatus = (typeof STAFF_STATUSES)[number]

export const DEPARTMENTS = [
  "Tamil", "English", "Mathematics", "Science", "Social Science", "Computer Science",
  "Physical Education", "Arts & Culture", "Administration", "Library",
] as const
export type Department = (typeof DEPARTMENTS)[number]

export const RETIREMENT_AGE = 60

export interface StaffMember {
  id: string
  staffId: string
  name: string
  designation: string
  cadre: string
  department: string
  gender: string
  dob: string
  doj: string
  qualification: string
  phone: string
  email: string
  employmentType: string
  status: StaffStatus
  casualLeaveBalance: number
  earnedLeaveBalance: number
  payScale: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface StaffInput {
  staffId: string
  name: string
  designation: string
  cadre: string
  department: string
  gender: string
  dob: string
  doj: string
  qualification: string
  phone: string
  email: string
  employmentType: string
  status: StaffStatus
  casualLeaveBalance: number
  earnedLeaveBalance: number
  payScale: string
  notes: string
}

export const GENDERS = ["Male", "Female", "Other"] as const

export function emptyStaff(): StaffInput {
  return {
    staffId: "", name: "", designation: "Graduate Teacher (BT)", cadre: "Teaching", department: "Mathematics",
    gender: "", dob: "", doj: "", qualification: "", phone: "", email: "", employmentType: "Permanent",
    status: "Active", casualLeaveBalance: 12, earnedLeaveBalance: 0, payScale: "", notes: "",
  }
}

function yearsBetween(fromStr: string, asOf: Date): number {
  const t = Date.parse(`${fromStr}T00:00:00Z`)
  if (!Number.isFinite(t)) return 0
  return Math.max(0, (asOf.getTime() - t) / (365.25 * 86400000))
}

export function serviceYears(doj: string, asOf: Date = new Date()): number {
  return Math.round(yearsBetween(doj, asOf) * 10) / 10
}
export function ageYears(dob: string, asOf: Date = new Date()): number {
  return Math.floor(yearsBetween(dob, asOf))
}
/** Within 1 year of the retirement age. */
export function retirementDue(dob: string, asOf: Date = new Date()): boolean {
  const age = yearsBetween(dob, asOf)
  return age >= RETIREMENT_AGE - 1
}
export function totalLeaveBalance(s: Pick<StaffMember, "casualLeaveBalance" | "earnedLeaveBalance">): number {
  return Math.max(0, s.casualLeaveBalance || 0) + Math.max(0, s.earnedLeaveBalance || 0)
}

export type StaffErrors = Partial<Record<keyof StaffInput, string>>

const STAFF_RE = /^EMP-\d{3,5}$/
const PHONE_RE = /^\d{10}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function validateStaff(f: StaffInput): { ok: boolean; errors: StaffErrors } {
  const e: StaffErrors = {}
  if (!STAFF_RE.test(f.staffId.trim())) e.staffId = "Staff id like EMP-001"
  if (!f.name.trim()) e.name = "Name is required"
  if (!(DESIGNATIONS as readonly string[]).includes(f.designation)) e.designation = "Select the designation"
  if (!(CADRES as readonly string[]).includes(f.cadre)) e.cadre = "Select the cadre"
  if (!(DEPARTMENTS as readonly string[]).includes(f.department)) e.department = "Select the department"
  if (!(GENDERS as readonly string[]).includes(f.gender)) e.gender = "Select the gender"
  if (!DATE_RE.test(f.dob.trim())) e.dob = "Use a date like 1985-05-30"
  else { const a = ageYears(f.dob); if (a < 18 || a > 70) e.dob = "Date of birth looks out of range" }
  if (!DATE_RE.test(f.doj.trim())) e.doj = "Use a date like 2010-06-01"
  else if (DATE_RE.test(f.dob) && f.doj <= f.dob) e.doj = "Joining must be after date of birth"
  if (!f.qualification.trim()) e.qualification = "Qualification is required"
  if (!PHONE_RE.test(f.phone.trim())) e.phone = "Phone must be 10 digits"
  if (!EMAIL_RE.test(f.email.trim())) e.email = "Enter a valid email"
  if (!(EMPLOYMENT_TYPES as readonly string[]).includes(f.employmentType)) e.employmentType = "Select the employment type"
  if (!(STAFF_STATUSES as readonly string[]).includes(f.status)) e.status = "Select the status"
  if (!Number.isFinite(f.casualLeaveBalance) || f.casualLeaveBalance < 0) e.casualLeaveBalance = "Cannot be negative"
  if (!Number.isFinite(f.earnedLeaveBalance) || f.earnedLeaveBalance < 0) e.earnedLeaveBalance = "Cannot be negative"
  return { ok: Object.keys(e).length === 0, errors: e }
}

export interface StaffFilters {
  query?: string
  designation?: string
  cadre?: string
  employmentType?: string
  status?: string
  sortBy?: "name" | "service" | "staffId"
  sortDir?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export interface StaffSummary {
  total: number
  active: number
  teaching: number
  nonTeaching: number
  onLeave: number
  retiringSoon: number
}

export interface StaffPage {
  staff: StaffMember[]
  total: number
  totalPages: number
  page: number
  pageSize: number
  summary: StaffSummary
}

const DEFAULT_PAGE_SIZE = 10

export function staffSummary(list: StaffMember[], asOf: Date = new Date()): StaffSummary {
  let active = 0, teaching = 0, nonTeaching = 0, onLeave = 0, retiringSoon = 0
  for (const s of list) {
    if (s.status === "Active") active++
    if (s.status === "On Leave") onLeave++
    if (s.cadre === "Teaching") teaching++
    else nonTeaching++
    if (s.status !== "Retired" && retirementDue(s.dob, asOf)) retiringSoon++
  }
  return { total: list.length, active, teaching, nonTeaching, onLeave, retiringSoon }
}

export function queryStaff(all: StaffMember[], f: StaffFilters = {}, asOf: Date = new Date()): StaffPage {
  const q = (f.query ?? "").trim().toLowerCase()
  let rows = all.filter((s) => {
    if (q && !(`${s.name} ${s.staffId} ${s.email}`.toLowerCase().includes(q))) return false
    if (f.designation && s.designation !== f.designation) return false
    if (f.cadre && s.cadre !== f.cadre) return false
    if (f.employmentType && s.employmentType !== f.employmentType) return false
    if (f.status && s.status !== f.status) return false
    return true
  })
  const summary = staffSummary(rows, asOf)
  const dir = f.sortDir === "asc" ? 1 : -1
  const by = f.sortBy ?? "name"
  rows = [...rows].sort((a, b) => {
    if (by === "service") return (serviceYears(a.doj, asOf) - serviceYears(b.doj, asOf)) * dir
    const av = by === "staffId" ? a.staffId : a.name
    const bv = by === "staffId" ? b.staffId : b.name
    return av < bv ? -dir : av > bv ? dir : 0
  })
  const pageSize = f.pageSize && f.pageSize > 0 ? f.pageSize : DEFAULT_PAGE_SIZE
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, f.page ?? 1), totalPages)
  const start = (page - 1) * pageSize
  return { staff: rows.slice(start, start + pageSize), total, totalPages, page, pageSize, summary }
}
