// VASA-EOS(SE) — Student Fees & DBT-linked collections model + validation (school finance).
//
// One fee record per student per academic year: a breakdown of fee heads (the demand), a concession/
// waiver (RTE / scholarship / DBT credit), a receipts ledger (the collection), the resulting net
// demand → paid → balance, a DBT/scholarship linkage, and a derived payment status + defaulter flag.
// Pure, client-safe model shared by the form, the list filters and the store. Full-CRUD module at
// Policies-grade depth, with two nested arrays (heads + receipts) and a finance summary. Distinct
// from lib/fees (the static SIS ledger + school-level collection snapshots).

import { CLASS_LEVELS, SECTIONS } from "@/lib/students"

export { CLASS_LEVELS, SECTIONS }

export const FEE_HEAD_TYPES = ["Tuition", "Term Fee", "Laboratory", "Library", "Examination", "Sports", "Computer", "Special Fee"] as const
export type FeeHeadType = (typeof FEE_HEAD_TYPES)[number]

export const CONCESSION_TYPES = ["None", "RTE (Free)", "Scholarship", "DBT Credit", "Staff Ward", "Sibling", "Merit"] as const
export type ConcessionType = (typeof CONCESSION_TYPES)[number]

export const PAYMENT_MODES = ["Cash", "Cheque", "DD", "UPI", "Net Banking", "DBT Transfer"] as const
export type PaymentMode = (typeof PAYMENT_MODES)[number]

export type PaymentStatus = "Paid" | "Partial" | "Pending"

export interface FeeHead {
  type: string
  amount: number
}

export interface FeeReceipt {
  date: string
  amount: number
  mode: string
  reference: string
}

export interface FeeRecord {
  id: string
  student: string
  apaarId: string
  classLevel: string
  section: string
  academicYear: string
  heads: FeeHead[]
  concessionType: string
  concessionAmount: number
  scholarshipScheme: string
  dbtReference: string
  dueDate: string
  receipts: FeeReceipt[]
  notes: string
  createdAt: string
  updatedAt: string
}

export interface FeeInput {
  student: string
  apaarId: string
  classLevel: string
  section: string
  academicYear: string
  heads: FeeHead[]
  concessionType: string
  concessionAmount: number
  scholarshipScheme: string
  dbtReference: string
  dueDate: string
  receipts: FeeReceipt[]
  notes: string
}

export function emptyFee(): FeeInput {
  return {
    student: "", apaarId: "", classLevel: "", section: "A", academicYear: "2026-2027",
    heads: [{ type: "Tuition", amount: 0 }], concessionType: "None", concessionAmount: 0,
    scholarshipScheme: "", dbtReference: "", dueDate: "", receipts: [], notes: "",
  }
}

// ── Money maths (pure) ────────────────────────────────────────────────────────
export function feeGross(heads: FeeHead[]): number {
  return heads.reduce((s, h) => s + (Number.isFinite(h.amount) ? Math.max(0, h.amount) : 0), 0)
}
export function netDemand(rec: Pick<FeeRecord, "heads" | "concessionAmount">): number {
  return Math.max(0, feeGross(rec.heads) - Math.max(0, rec.concessionAmount || 0))
}
export function totalPaid(receipts: FeeReceipt[]): number {
  return receipts.reduce((s, r) => s + (Number.isFinite(r.amount) ? Math.max(0, r.amount) : 0), 0)
}
export function balance(rec: Pick<FeeRecord, "heads" | "concessionAmount" | "receipts">): number {
  return netDemand(rec) - totalPaid(rec.receipts)
}
export function paymentStatus(rec: Pick<FeeRecord, "heads" | "concessionAmount" | "receipts">): PaymentStatus {
  const bal = balance(rec)
  const paid = totalPaid(rec.receipts)
  if (bal <= 0) return "Paid"
  return paid > 0 ? "Partial" : "Pending"
}
/** A defaulter has an outstanding balance past the due date. */
export function isDefaulter(rec: Pick<FeeRecord, "heads" | "concessionAmount" | "receipts" | "dueDate">, asOf: Date = new Date()): boolean {
  if (balance(rec) <= 0) return false
  const due = Date.parse(`${rec.dueDate}T23:59:59Z`)
  return Number.isFinite(due) && due < asOf.getTime()
}
/** Indian Rupee formatting. */
export function inr(rupees: number): string {
  return `₹${Math.round(rupees).toLocaleString("en-IN")}`
}

export type FeeErrors = Partial<Record<keyof FeeInput, string>>

const APAAR_RE = /^\d{12}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const AY_RE = /^\d{4}-\d{4}$/

export function validateFee(f: FeeInput): { ok: boolean; errors: FeeErrors } {
  const e: FeeErrors = {}
  if (!f.student.trim()) e.student = "Student name is required"
  if (f.apaarId.trim() && !APAAR_RE.test(f.apaarId.trim())) e.apaarId = "APAAR id must be 12 digits (or leave blank)"
  if (!(CLASS_LEVELS as readonly string[]).includes(f.classLevel)) e.classLevel = "Select the class"
  if (!(SECTIONS as readonly string[]).includes(f.section)) e.section = "Select the section"
  if (!AY_RE.test(f.academicYear.trim())) e.academicYear = "Use an academic year like 2026-2027"
  else { const [a, b] = f.academicYear.split("-").map(Number); if (b !== a + 1) e.academicYear = "Academic year must be consecutive" }
  if (!DATE_RE.test(f.dueDate.trim())) e.dueDate = "Use a due date like 2026-07-31"
  if (!(CONCESSION_TYPES as readonly string[]).includes(f.concessionType)) e.concessionType = "Select a concession type"
  if (!Array.isArray(f.heads) || f.heads.length === 0) e.heads = "Add at least one fee head"
  else if (f.heads.some((h) => !(FEE_HEAD_TYPES as readonly string[]).includes(h.type) || !Number.isFinite(h.amount) || h.amount < 0)) e.heads = "Each fee head needs a type and a non-negative amount"
  const gross = feeGross(f.heads)
  if (!Number.isFinite(f.concessionAmount) || f.concessionAmount < 0) e.concessionAmount = "Concession cannot be negative"
  else if (f.concessionAmount > gross) e.concessionAmount = "Concession cannot exceed the gross demand"
  if (f.receipts.some((r) => !DATE_RE.test(r.date) || !Number.isFinite(r.amount) || r.amount <= 0 || !(PAYMENT_MODES as readonly string[]).includes(r.mode))) e.receipts = "Each receipt needs a date, positive amount and a valid mode"
  if (f.concessionType === "DBT Credit" && !f.dbtReference.trim()) e.dbtReference = "DBT reference is required for a DBT credit"
  return { ok: Object.keys(e).length === 0, errors: e }
}

export interface FeeFilters {
  query?: string
  classLevel?: string
  section?: string
  academicYear?: string
  status?: string
  defaulter?: boolean
  sortBy?: "student" | "balance" | "dueDate"
  sortDir?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export interface FeeSummary {
  demand: number
  collected: number
  outstanding: number
  collectionRate: number
  defaulters: number
}

export interface FeePage {
  records: FeeRecord[]
  total: number
  totalPages: number
  page: number
  pageSize: number
  summary: FeeSummary
}

const DEFAULT_PAGE_SIZE = 10

export function feeSummary(records: FeeRecord[], asOf: Date = new Date()): FeeSummary {
  let demand = 0, collected = 0, defaulters = 0
  for (const r of records) {
    demand += netDemand(r)
    collected += totalPaid(r.receipts)
    if (isDefaulter(r, asOf)) defaulters++
  }
  const outstanding = Math.max(0, demand - collected)
  const collectionRate = demand > 0 ? Math.round((collected / demand) * 1000) / 10 : 0
  return { demand, collected, outstanding, collectionRate, defaulters }
}

export function queryFees(all: FeeRecord[], f: FeeFilters = {}, asOf: Date = new Date()): FeePage {
  const q = (f.query ?? "").trim().toLowerCase()
  let rows = all.filter((r) => {
    if (q && !(`${r.student} ${r.apaarId}`.toLowerCase().includes(q))) return false
    if (f.classLevel && r.classLevel !== f.classLevel) return false
    if (f.section && r.section !== f.section) return false
    if (f.academicYear && r.academicYear !== f.academicYear) return false
    if (f.status && paymentStatus(r) !== f.status) return false
    if (f.defaulter && !isDefaulter(r, asOf)) return false
    return true
  })
  const summary = feeSummary(rows, asOf)
  const dir = f.sortDir === "asc" ? 1 : -1
  const by = f.sortBy ?? "student"
  rows = [...rows].sort((a, b) => {
    if (by === "balance") return (balance(a) - balance(b)) * dir
    const av = by === "dueDate" ? a.dueDate : a.student
    const bv = by === "dueDate" ? b.dueDate : b.student
    return av < bv ? -dir : av > bv ? dir : 0
  })
  const pageSize = f.pageSize && f.pageSize > 0 ? f.pageSize : DEFAULT_PAGE_SIZE
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, f.page ?? 1), totalPages)
  const start = (page - 1) * pageSize
  return { records: rows.slice(start, start + pageSize), total, totalPages, page, pageSize, summary }
}
