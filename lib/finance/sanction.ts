// VASA-EOS(SE) — budget sanction & re-appropriation engine (the Secretary's competent-authority power).
//
// The Secretary, School Education sanctions the public purse: releasing supplementary funds to a head and
// re-appropriating *savings* (unspent balance) from one head to another within a grant. This models that
// authority as pure, testable logic over the live budget — a re-appropriation may only move funds a head has
// NOT already spent (allocated − spent), so the engine refuses to reappropriate committed money, and refuses
// self-transfers or over-draws. applySanction() returns the post-sanction budget; nothing mutates in place.
// Pure + client-safe.

import { BUDGET, type BudgetLine } from "@/lib/finance"

export type SanctionKind = "reappropriation" | "supplementary"
export type SanctionStatus = "proposed" | "sanctioned" | "rejected"

export interface SanctionProposal {
  id: string
  kind: SanctionKind
  /** Head receiving the funds. */
  targetHead: string
  /** Head the savings are drawn from (re-appropriation only). */
  sourceHead?: string
  amount: number
  justification: string
  /** Competent authority tier (Secretary acts at state tier). */
  authorityTier: string
  status: SanctionStatus
}

export const SANCTION_PROPOSALS: SanctionProposal[] = [
  { id: "SP-001", kind: "reappropriation", targetHead: "Infrastructure & maintenance", sourceHead: "Sports & co-curricular", amount: 40000, justification: "Urgent toilet repairs ahead of the monsoon (RTE §19).", authorityTier: "state", status: "sanctioned" },
  { id: "SP-002", kind: "reappropriation", targetHead: "PM POSHAN / CMBS", sourceHead: "Library & TLM", amount: 50000, justification: "Cover seasonal vegetable price rise in mid-day meals.", authorityTier: "state", status: "proposed" },
  { id: "SP-003", kind: "supplementary", targetHead: "Samagra Shiksha (composite grant)", amount: 200000, justification: "Additional FLN teaching-learning material procurement.", authorityTier: "state", status: "proposed" },
  { id: "SP-004", kind: "reappropriation", targetHead: "Sports & co-curricular", sourceHead: "PM POSHAN / CMBS", amount: 600000, justification: "Over-draw attempt — exceeds source savings.", authorityTier: "state", status: "rejected" },
]

/** Savings available on a head for re-appropriation: allocation not yet spent. */
export function availableForReappropriation(head: string, budget: BudgetLine[] = BUDGET): number {
  const line = budget.find((b) => b.head === head)
  return line ? Math.max(0, line.allocated - line.spent) : 0
}

export interface ValidationResult {
  ok: boolean
  reason: string
}

export function validateProposal(p: SanctionProposal, budget: BudgetLine[] = BUDGET): ValidationResult {
  if (p.amount <= 0) return { ok: false, reason: "Amount must be positive" }
  const target = budget.find((b) => b.head === p.targetHead)
  if (!target) return { ok: false, reason: `Unknown target head: ${p.targetHead}` }
  if (p.kind === "supplementary") return { ok: true, reason: "Supplementary sanction" }
  // re-appropriation
  if (!p.sourceHead) return { ok: false, reason: "Re-appropriation needs a source head" }
  if (p.sourceHead === p.targetHead) return { ok: false, reason: "Source and target must differ" }
  const source = budget.find((b) => b.head === p.sourceHead)
  if (!source) return { ok: false, reason: `Unknown source head: ${p.sourceHead}` }
  const savings = availableForReappropriation(p.sourceHead, budget)
  if (p.amount > savings) return { ok: false, reason: `Exceeds source savings (${savings})` }
  return { ok: true, reason: "Within source savings" }
}

/** Apply a sanctioned, valid proposal and return the post-sanction budget (immutable). */
export function applySanction(p: SanctionProposal, budget: BudgetLine[] = BUDGET): BudgetLine[] {
  if (p.status !== "sanctioned" || !validateProposal(p, budget).ok) {
    return budget.map((b) => ({ ...b }))
  }
  return budget.map((b) => {
    let allocated = b.allocated
    if (b.head === p.targetHead) allocated += p.amount
    if (p.kind === "reappropriation" && b.head === p.sourceHead) allocated -= p.amount
    return { ...b, allocated, spent: b.spent }
  })
}

/** Apply every sanctioned proposal in order, returning the resulting budget. */
export function applyAllSanctioned(proposals: SanctionProposal[] = SANCTION_PROPOSALS, budget: BudgetLine[] = BUDGET): BudgetLine[] {
  return proposals.reduce((acc, p) => applySanction(p, acc), budget.map((b) => ({ ...b })))
}

export interface SanctionSummary {
  proposals: number
  sanctioned: number
  proposed: number
  rejected: number
  /** Net funds moved/added by sanctioned proposals. */
  sanctionedAmount: number
  /** Proposals that pass validation. */
  valid: number
}

export function sanctionSummary(proposals: SanctionProposal[] = SANCTION_PROPOSALS, budget: BudgetLine[] = BUDGET): SanctionSummary {
  return {
    proposals: proposals.length,
    sanctioned: proposals.filter((p) => p.status === "sanctioned").length,
    proposed: proposals.filter((p) => p.status === "proposed").length,
    rejected: proposals.filter((p) => p.status === "rejected").length,
    sanctionedAmount: proposals.filter((p) => p.status === "sanctioned").reduce((s, p) => s + p.amount, 0),
    valid: proposals.filter((p) => validateProposal(p, budget).ok).length,
  }
}

function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(proposals: SanctionProposal[] = SANCTION_PROPOSALS, budget: BudgetLine[] = BUDGET): string {
  const header = ["ID", "Kind", "Target head", "Source head", "Amount", "Justification", "Authority", "Status", "Valid"]
  const rows = proposals.map((p) =>
    [p.id, p.kind, p.targetHead, p.sourceHead ?? "—", String(p.amount), p.justification, p.authorityTier, p.status, validateProposal(p, budget).ok ? "yes" : "no"].map(csvField).join(","),
  )
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
