// VASA-EOS(SE) — School Financial Management (Sec 44).
// Budget, grants, expenditure and receipts with IFHRMS/PFMS integration and
// CAG-ready statutory reporting. Amounts illustrative (in ₹).

export interface BudgetLine {
  head: string
  allocated: number
  spent: number
}

export const BUDGET: BudgetLine[] = [
  { head: "Samagra Shiksha (composite grant)", allocated: 1200000, spent: 940000 },
  { head: "PM POSHAN / CMBS", allocated: 3600000, spent: 3120000 },
  { head: "Infrastructure & maintenance", allocated: 800000, spent: 510000 },
  { head: "Library & TLM", allocated: 150000, spent: 96000 },
  { head: "Sports & co-curricular", allocated: 120000, spent: 74000 },
]

export interface FinanceSummary {
  allocated: number
  spent: number
  utilisationPct: number
}

export function financeSummary(lines: BudgetLine[] = BUDGET): FinanceSummary {
  const allocated = lines.reduce((s, b) => s + b.allocated, 0)
  const spent = lines.reduce((s, b) => s + b.spent, 0)
  return { allocated, spent, utilisationPct: allocated ? Math.round((spent / allocated) * 100) : 0 }
}

export const STATUTORY_REPORTS: { name: string; cadence: string }[] = [
  { name: "Utilisation Certificate (UC)", cadence: "Per scheme / quarterly" },
  { name: "PFMS component-wise expenditure", cadence: "Monthly" },
  { name: "IFHRMS salary & pension", cadence: "Monthly" },
  { name: "CAG audit pack", cadence: "Annual" },
]

export function inr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`
}
