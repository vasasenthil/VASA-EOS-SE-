// VASA-EOS(SE) — fee management (Sec 44 / school finance · parent pay:fees).
// Government schools are largely fee-free; matriculation/special heads carry small
// amounts. Pure ledger maths over a seeded per-student ledger (rupees).

import { SIS_ROSTER, type SisStudent } from "@/lib/sis"

export interface FeeHead {
  code: string
  label: string
  amount: number // rupees
}

export const FEE_HEADS: FeeHead[] = [
  { code: "exam", label: "Examination fee", amount: 200 },
  { code: "library", label: "Library & reading room", amount: 150 },
  { code: "lab", label: "Computer / science lab", amount: 300 },
  { code: "sports", label: "Sports & co-curricular", amount: 150 },
]

export const TOTAL_BILLED_PER_STUDENT = FEE_HEADS.reduce((s, h) => s + h.amount, 0)

export interface FeeLedgerRow {
  apaarId: string
  name: string
  className: string
  billed: number
  paid: number
}

// Deterministic seeded ledger: a varying share already collected.
export const FEE_LEDGER: FeeLedgerRow[] = SIS_ROSTER.map((s: SisStudent, i: number) => {
  const billed = TOTAL_BILLED_PER_STUDENT
  // 0%, 50% or 100% paid, rotating — illustrative.
  const paid = [billed, Math.round(billed / 2), 0][i % 3]
  return { apaarId: s.apaarId, name: s.name, className: s.className, billed, paid }
})

export type FeeStatus = "paid" | "partial" | "due"

export function balanceOf(row: FeeLedgerRow): number {
  return Math.max(row.billed - row.paid, 0)
}

export function statusOf(row: FeeLedgerRow): FeeStatus {
  if (row.paid >= row.billed) return "paid"
  if (row.paid > 0) return "partial"
  return "due"
}

export interface FeeSummary {
  students: number
  billed: number
  paid: number
  due: number
  collectedPct: number
}

export function feeSummary(rows: FeeLedgerRow[] = FEE_LEDGER): FeeSummary {
  const billed = rows.reduce((s, r) => s + r.billed, 0)
  const paid = rows.reduce((s, r) => s + r.paid, 0)
  return {
    students: rows.length,
    billed,
    paid,
    due: billed - paid,
    collectedPct: billed === 0 ? 0 : Math.round((paid / billed) * 100),
  }
}

export function inr(rupees: number): string {
  return `₹${rupees.toLocaleString("en-IN")}`
}
