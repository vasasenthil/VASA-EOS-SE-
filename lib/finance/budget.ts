// VASA-EOS(SE) — Budget sanction / re-appropriation form + Cabinet rule (Finance, State tier).
//
// Three proposal types: a FRESH sanction (always Cabinet-bound as it commits new expenditure),
// a RE-APPROPRIATION (moving funds between heads — needs a distinct source head), and a
// SUPPLEMENTARY grant. High-value proposals (>= ₹50 crore) also need Cabinet/Minister approval.
// This is the rich form and the pure rules that decide the route. Pure + client-safe.

export const PROPOSAL_TYPES = ["Fresh sanction", "Re-appropriation", "Supplementary"] as const
export type ProposalType = (typeof PROPOSAL_TYPES)[number]

export const BUDGET_HEADS = [
  "2202 — General Education",
  "2202-01 — Elementary Education",
  "2202-02 — Secondary Education",
  "2202-04 — Adult Education",
  "4202 — Capital Outlay (Education)",
] as const

/** Proposals at/above this value need Cabinet/Minister approval (₹50 crore). */
export const CABINET_THRESHOLD = 500000000

export interface BudgetForm {
  scheme: string
  proposalType: ProposalType
  budgetHead: string
  fromHead: string
  amount: number
  fiscalYear: string
  justification: string
  declaration: boolean
}

export function emptyBudget(): BudgetForm {
  return { scheme: "", proposalType: "Fresh sanction", budgetHead: "", fromHead: "", amount: 0, fiscalYear: "2026-27", justification: "", declaration: false }
}

export type FieldErrors = Partial<Record<keyof BudgetForm, string>>

const MIN_JUSTIFICATION = 20

export function validateBudget(f: BudgetForm): { ok: boolean; errors: FieldErrors } {
  const e: FieldErrors = {}
  if (!f.scheme.trim()) e.scheme = "Scheme / purpose is required"
  if (!(PROPOSAL_TYPES as readonly string[]).includes(f.proposalType)) e.proposalType = "Select a proposal type"
  if (!(BUDGET_HEADS as readonly string[]).includes(f.budgetHead)) e.budgetHead = "Select the budget head"
  if (f.proposalType === "Re-appropriation") {
    if (!(BUDGET_HEADS as readonly string[]).includes(f.fromHead)) e.fromHead = "Re-appropriation needs a source head"
    else if (f.fromHead === f.budgetHead) e.fromHead = "The source head must differ from the target head"
  }
  if (!Number.isFinite(f.amount) || f.amount <= 0) e.amount = "Enter the amount (₹)"
  if (!/^\d{4}-\d{2}$/.test(f.fiscalYear.trim())) e.fiscalYear = "Use a fiscal year like 2026-27"
  if (f.justification.trim().length < MIN_JUSTIFICATION) e.justification = `Provide a justification (min ${MIN_JUSTIFICATION} characters)`
  if (!f.declaration) e.declaration = "You must certify the proposal and fund position"
  return { ok: Object.keys(e).length === 0, errors: e }
}

/** True when the proposal needs Cabinet/Minister approval (fresh scheme or high value). */
export function needsCabinet(f: BudgetForm): boolean {
  return f.proposalType === "Fresh sanction" || (Number.isFinite(f.amount) && f.amount >= CABINET_THRESHOLD)
}
