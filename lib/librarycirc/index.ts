// VASA-EOS(SE) — Library Circulation model, validation + fine logic (school operations).
//
// One loan record per book copy issued to a member: the book (accession no, title, author,
// category), the member (name, id, type, class), the issue/due/return dates, renewals and the fine
// policy. Pure, client-safe model shared by the form, the list filters and the store. Derived loan
// status (Issued/Returned/Overdue) and fine due. Full-CRUD module at Policies-grade depth. Distinct
// from lib/library (static catalogue) and lib/circulation (the basic issue/return desk).

import { CLASS_LEVELS } from "@/lib/students"

export { CLASS_LEVELS }

export const BOOK_CATEGORIES = ["Textbook", "Reference", "Fiction", "Non-fiction", "Periodical", "Competitive Exam", "Children"] as const
export type BookCategory = (typeof BOOK_CATEGORIES)[number]

export const MEMBER_TYPES = ["Student", "Teacher", "Staff"] as const
export type MemberType = (typeof MEMBER_TYPES)[number]

export type LoanStatus = "Issued" | "Returned" | "Overdue"

export const DEFAULT_LOAN_DAYS = 14
export const DEFAULT_FINE_PER_DAY = 2 // ₹
export const MAX_RENEWALS = 2

export interface LibraryLoan {
  id: string
  accessionNo: string
  title: string
  author: string
  category: string
  member: string
  memberId: string
  memberType: string
  classLevel: string
  issueDate: string
  dueDate: string
  returnDate: string
  renewalCount: number
  finePerDay: number
  fineWaived: number
  notes: string
  createdAt: string
  updatedAt: string
}

export interface LoanInput {
  accessionNo: string
  title: string
  author: string
  category: string
  member: string
  memberId: string
  memberType: string
  classLevel: string
  issueDate: string
  dueDate: string
  returnDate: string
  renewalCount: number
  finePerDay: number
  fineWaived: number
  notes: string
}

export function emptyLoan(): LoanInput {
  const today = new Date().toISOString().slice(0, 10)
  const due = new Date(Date.now() + DEFAULT_LOAN_DAYS * 86400000).toISOString().slice(0, 10)
  return {
    accessionNo: "", title: "", author: "", category: "Textbook", member: "", memberId: "", memberType: "Student",
    classLevel: "", issueDate: today, dueDate: due, returnDate: "", renewalCount: 0, finePerDay: DEFAULT_FINE_PER_DAY, fineWaived: 0, notes: "",
  }
}

function daysBetween(aStr: string, bStr: string): number {
  const a = Date.parse(`${aStr}T00:00:00Z`)
  const b = Date.parse(`${bStr}T00:00:00Z`)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0
  return Math.floor((b - a) / 86400000)
}

/** Loan status: Returned if returned, else Overdue past the due date, else Issued. */
export function loanStatus(loan: Pick<LibraryLoan, "dueDate" | "returnDate">, asOf: Date = new Date()): LoanStatus {
  if (loan.returnDate) return "Returned"
  const today = asOf.toISOString().slice(0, 10)
  return today > loan.dueDate ? "Overdue" : "Issued"
}

/** Overdue days: against return date if returned, else against today. Never negative. */
export function overdueDays(loan: Pick<LibraryLoan, "dueDate" | "returnDate">, asOf: Date = new Date()): number {
  const ref = loan.returnDate || asOf.toISOString().slice(0, 10)
  return Math.max(0, daysBetween(loan.dueDate, ref))
}

/** Fine due = overdue days × fine/day − waived (never negative). */
export function fineDue(loan: Pick<LibraryLoan, "dueDate" | "returnDate" | "finePerDay" | "fineWaived">, asOf: Date = new Date()): number {
  const gross = overdueDays(loan, asOf) * Math.max(0, loan.finePerDay || 0)
  return Math.max(0, gross - Math.max(0, loan.fineWaived || 0))
}

export function canRenew(loan: Pick<LibraryLoan, "returnDate" | "renewalCount">): boolean {
  return !loan.returnDate && loan.renewalCount < MAX_RENEWALS
}

export function inr(rupees: number): string {
  return `₹${Math.round(rupees).toLocaleString("en-IN")}`
}

export type LoanErrors = Partial<Record<keyof LoanInput, string>>

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const ACC_RE = /^[A-Z]{2,4}-\d{3,6}$/

export function validateLoan(f: LoanInput): { ok: boolean; errors: LoanErrors } {
  const e: LoanErrors = {}
  if (!ACC_RE.test(f.accessionNo.trim())) e.accessionNo = "Accession no like ACC-00123"
  if (!f.title.trim()) e.title = "Title is required"
  if (!f.author.trim()) e.author = "Author is required"
  if (!(BOOK_CATEGORIES as readonly string[]).includes(f.category)) e.category = "Select the category"
  if (!f.member.trim()) e.member = "Member name is required"
  if (!f.memberId.trim()) e.memberId = "Member id is required"
  if (!(MEMBER_TYPES as readonly string[]).includes(f.memberType)) e.memberType = "Select the member type"
  if (f.memberType === "Student" && !(CLASS_LEVELS as readonly string[]).includes(f.classLevel)) e.classLevel = "Select the class for a student"
  if (!DATE_RE.test(f.issueDate)) e.issueDate = "Use a date like 2026-06-15"
  if (!DATE_RE.test(f.dueDate)) e.dueDate = "Use a date like 2026-06-29"
  else if (DATE_RE.test(f.issueDate) && f.dueDate < f.issueDate) e.dueDate = "Due date cannot be before issue date"
  if (f.returnDate.trim()) {
    if (!DATE_RE.test(f.returnDate)) e.returnDate = "Use a date like 2026-06-28"
    else if (DATE_RE.test(f.issueDate) && f.returnDate < f.issueDate) e.returnDate = "Return cannot be before issue"
  }
  if (!Number.isFinite(f.finePerDay) || f.finePerDay < 0) e.finePerDay = "Fine/day cannot be negative"
  if (!Number.isInteger(f.renewalCount) || f.renewalCount < 0) e.renewalCount = "Renewals cannot be negative"
  if (!Number.isFinite(f.fineWaived) || f.fineWaived < 0) e.fineWaived = "Waived amount cannot be negative"
  return { ok: Object.keys(e).length === 0, errors: e }
}

export interface LoanFilters {
  query?: string
  status?: string
  category?: string
  memberType?: string
  sortBy?: "dueDate" | "title" | "member"
  sortDir?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export interface CirculationSummary {
  total: number
  issued: number
  overdue: number
  returned: number
  fineDue: number
}

export interface LoanPage {
  loans: LibraryLoan[]
  total: number
  totalPages: number
  page: number
  pageSize: number
  summary: CirculationSummary
}

const DEFAULT_PAGE_SIZE = 10

export function circulationSummary(loans: LibraryLoan[], asOf: Date = new Date()): CirculationSummary {
  const out: CirculationSummary = { total: loans.length, issued: 0, overdue: 0, returned: 0, fineDue: 0 }
  for (const l of loans) {
    const st = loanStatus(l, asOf)
    if (st === "Issued") out.issued++
    else if (st === "Overdue") out.overdue++
    else out.returned++
    out.fineDue += fineDue(l, asOf)
  }
  return out
}

export function queryLoans(all: LibraryLoan[], f: LoanFilters = {}, asOf: Date = new Date()): LoanPage {
  const q = (f.query ?? "").trim().toLowerCase()
  let rows = all.filter((l) => {
    if (q && !(`${l.title} ${l.member} ${l.accessionNo}`.toLowerCase().includes(q))) return false
    if (f.status && loanStatus(l, asOf) !== f.status) return false
    if (f.category && l.category !== f.category) return false
    if (f.memberType && l.memberType !== f.memberType) return false
    return true
  })
  const summary = circulationSummary(rows, asOf)
  const dir = f.sortDir === "asc" ? 1 : -1
  const by = f.sortBy ?? "dueDate"
  rows = [...rows].sort((a, b) => {
    const av = by === "title" ? a.title : by === "member" ? a.member : a.dueDate
    const bv = by === "title" ? b.title : by === "member" ? b.member : b.dueDate
    return av < bv ? -dir : av > bv ? dir : 0
  })
  const pageSize = f.pageSize && f.pageSize > 0 ? f.pageSize : DEFAULT_PAGE_SIZE
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, f.page ?? 1), totalPages)
  const start = (page - 1) * pageSize
  return { loans: rows.slice(start, start + pageSize), total, totalPages, page, pageSize, summary }
}
