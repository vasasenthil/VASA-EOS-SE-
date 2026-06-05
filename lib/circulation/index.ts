// VASA-EOS(SE) — library circulation (Sec 37) — issue / return / overdue on top of
// the catalogue. Pure date + status helpers; the UI manages the loan list and copy
// availability live.

export const LOAN_DAYS = 14

export interface Loan {
  id: string
  bookId: string
  bookTitle: string
  borrower: string
  issuedOn: string // YYYY-MM-DD
  dueOn: string
  returnedOn?: string
}

/** Add days to a YYYY-MM-DD date, returning YYYY-MM-DD. */
export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function dueDate(issuedOn: string, days: number = LOAN_DAYS): string {
  return addDays(issuedOn, days)
}

export function isOverdue(loan: Loan, today: string): boolean {
  return !loan.returnedOn && loan.dueOn < today
}

export type LoanStatus = "returned" | "overdue" | "active"

export function loanStatus(loan: Loan, today: string): LoanStatus {
  if (loan.returnedOn) return "returned"
  return isOverdue(loan, today) ? "overdue" : "active"
}

export interface CircSummary {
  active: number
  overdue: number
  returned: number
}

export function circSummary(loans: Loan[], today: string): CircSummary {
  return {
    active: loans.filter((l) => loanStatus(l, today) === "active").length,
    overdue: loans.filter((l) => loanStatus(l, today) === "overdue").length,
    returned: loans.filter((l) => l.returnedOn).length,
  }
}
