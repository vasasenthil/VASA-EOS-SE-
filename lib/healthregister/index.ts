// VASA-EOS(SE) — School Health Register model + validation (school operations · health).
//
// The routine per-student health screening register: anthropometry (height/weight → computed BMI and
// an indicative nutrition band), vision/hearing/dental screening, immunisation status and an optional
// haemoglobin reading (anaemia flag). Pure, client-safe model shared by the form, the list filters
// and the store. Full-CRUD module at Policies-grade depth. Complements lib/health (RBSK clinical
// referrals): this is the routine register; abnormal findings flag a referral.
//
// NOTE: the BMI band uses standard adult cut-offs as an INDICATIVE school-register signal; RBSK
// provides the age/sex-appropriate clinical screening of record. Surfaced honestly in the UI.

import { CLASS_LEVELS, SECTIONS, GENDERS } from "@/lib/students"

export { CLASS_LEVELS, SECTIONS, GENDERS }

export const SCREEN_RESULTS = ["Normal", "Refer"] as const
export type ScreenResult = (typeof SCREEN_RESULTS)[number]

export type BmiBand = "Underweight" | "Normal" | "Overweight" | "Obese" | "—"

export const ANAEMIA_HB_THRESHOLD = 11.5 // g/dL (school-age indicative)

export interface HealthRecord {
  id: string
  student: string
  apaarId: string
  classLevel: string
  section: string
  gender: string
  screeningDate: string
  heightCm: number
  weightKg: number
  vision: ScreenResult
  hearing: ScreenResult
  dental: ScreenResult
  immunisationUpToDate: boolean
  hemoglobin: number // g/dL; 0 = not measured
  remarks: string
  createdAt: string
  updatedAt: string
}

export interface HealthInput {
  student: string
  apaarId: string
  classLevel: string
  section: string
  gender: string
  screeningDate: string
  heightCm: number
  weightKg: number
  vision: ScreenResult
  hearing: ScreenResult
  dental: ScreenResult
  immunisationUpToDate: boolean
  hemoglobin: number
  remarks: string
}

export function emptyHealth(): HealthInput {
  return {
    student: "", apaarId: "", classLevel: "", section: "A", gender: "", screeningDate: new Date().toISOString().slice(0, 10),
    heightCm: 0, weightKg: 0, vision: "Normal", hearing: "Normal", dental: "Normal", immunisationUpToDate: true, hemoglobin: 0, remarks: "",
  }
}

// ── Derived (pure) ────────────────────────────────────────────────────────────
/** Body Mass Index = kg / m^2, 1 dp; 0 if invalid. */
export function bmi(r: Pick<HealthRecord, "heightCm" | "weightKg">): number {
  const h = r.heightCm / 100
  if (!(h > 0) || !(r.weightKg > 0)) return 0
  return Math.round((r.weightKg / (h * h)) * 10) / 10
}

export function bmiBand(r: Pick<HealthRecord, "heightCm" | "weightKg">): BmiBand {
  const b = bmi(r)
  if (b <= 0) return "—"
  if (b < 18.5) return "Underweight"
  if (b < 25) return "Normal"
  if (b < 30) return "Overweight"
  return "Obese"
}

export function isAnaemic(r: Pick<HealthRecord, "hemoglobin">): boolean {
  return r.hemoglobin > 0 && r.hemoglobin < ANAEMIA_HB_THRESHOLD
}

/** Any finding outside normal → flag for an RBSK referral. */
export function needsReferral(r: Pick<HealthRecord, "heightCm" | "weightKg" | "vision" | "hearing" | "dental" | "immunisationUpToDate" | "hemoglobin">): boolean {
  const band = bmiBand(r)
  return band === "Underweight" || band === "Obese" || r.vision === "Refer" || r.hearing === "Refer" || r.dental === "Refer" || !r.immunisationUpToDate || isAnaemic(r)
}

export function referralReasons(r: Pick<HealthRecord, "heightCm" | "weightKg" | "vision" | "hearing" | "dental" | "immunisationUpToDate" | "hemoglobin">): string[] {
  const out: string[] = []
  const band = bmiBand(r)
  if (band === "Underweight") out.push("Underweight — nutrition support")
  if (band === "Obese") out.push("Obese — dietary counselling")
  if (r.vision === "Refer") out.push("Vision — ophthalmology")
  if (r.hearing === "Refer") out.push("Hearing — audiology")
  if (r.dental === "Refer") out.push("Dental")
  if (isAnaemic(r)) out.push("Anaemia — iron/folic supplementation")
  if (!r.immunisationUpToDate) out.push("Immunisation overdue")
  return out
}

export type HealthErrors = Partial<Record<keyof HealthInput, string>>

const APAAR_RE = /^\d{12}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function validateHealth(f: HealthInput): { ok: boolean; errors: HealthErrors } {
  const e: HealthErrors = {}
  if (!f.student.trim()) e.student = "Student name is required"
  if (f.apaarId.trim() && !APAAR_RE.test(f.apaarId.trim())) e.apaarId = "APAAR id must be 12 digits (or leave blank)"
  if (!(CLASS_LEVELS as readonly string[]).includes(f.classLevel)) e.classLevel = "Select the class"
  if (!(SECTIONS as readonly string[]).includes(f.section)) e.section = "Select the section"
  if (!(GENDERS as readonly string[]).includes(f.gender)) e.gender = "Select the gender"
  if (!DATE_RE.test(f.screeningDate.trim())) e.screeningDate = "Use a date like 2026-06-30"
  if (!Number.isFinite(f.heightCm) || f.heightCm < 50 || f.heightCm > 220) e.heightCm = "Height (cm) looks out of range"
  if (!Number.isFinite(f.weightKg) || f.weightKg < 5 || f.weightKg > 150) e.weightKg = "Weight (kg) looks out of range"
  for (const [k, label] of [["vision", "Vision"], ["hearing", "Hearing"], ["dental", "Dental"]] as const) {
    if (!(SCREEN_RESULTS as readonly string[]).includes(f[k])) e[k] = `Select the ${label.toLowerCase()} result`
  }
  if (!Number.isFinite(f.hemoglobin) || f.hemoglobin < 0 || f.hemoglobin > 25) e.hemoglobin = "Haemoglobin (g/dL) looks out of range"
  return { ok: Object.keys(e).length === 0, errors: e }
}

export interface HealthFilters {
  query?: string
  classLevel?: string
  section?: string
  band?: string
  referral?: boolean
  sortBy?: "student" | "screeningDate" | "bmi"
  sortDir?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export interface HealthSummary {
  total: number
  underweight: number
  overweight: number
  anaemia: number
  referrals: number
}

export interface HealthPage {
  records: HealthRecord[]
  total: number
  totalPages: number
  page: number
  pageSize: number
  summary: HealthSummary
}

const DEFAULT_PAGE_SIZE = 10

export function healthSummary(records: HealthRecord[]): HealthSummary {
  let underweight = 0, overweight = 0, anaemia = 0, referrals = 0
  for (const r of records) {
    const band = bmiBand(r)
    if (band === "Underweight") underweight++
    if (band === "Overweight" || band === "Obese") overweight++
    if (isAnaemic(r)) anaemia++
    if (needsReferral(r)) referrals++
  }
  return { total: records.length, underweight, overweight, anaemia, referrals }
}

export function queryHealth(all: HealthRecord[], f: HealthFilters = {}): HealthPage {
  const q = (f.query ?? "").trim().toLowerCase()
  let rows = all.filter((r) => {
    if (q && !(`${r.student} ${r.apaarId}`.toLowerCase().includes(q))) return false
    if (f.classLevel && r.classLevel !== f.classLevel) return false
    if (f.section && r.section !== f.section) return false
    if (f.band && bmiBand(r) !== f.band) return false
    if (f.referral && !needsReferral(r)) return false
    return true
  })
  const summary = healthSummary(rows)
  const dir = f.sortDir === "asc" ? 1 : -1
  const by = f.sortBy ?? "screeningDate"
  rows = [...rows].sort((a, b) => {
    if (by === "bmi") return (bmi(a) - bmi(b)) * dir
    const av = by === "student" ? a.student : a.screeningDate
    const bv = by === "student" ? b.student : b.screeningDate
    return av < bv ? -dir : av > bv ? dir : 0
  })
  const pageSize = f.pageSize && f.pageSize > 0 ? f.pageSize : DEFAULT_PAGE_SIZE
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, f.page ?? 1), totalPages)
  const start = (page - 1) * pageSize
  return { records: rows.slice(start, start + pageSize), total, totalPages, page, pageSize, summary }
}
