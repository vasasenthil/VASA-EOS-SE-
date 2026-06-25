// VASA-EOS(SE) — Policy Impact Simulator: Policy Engine wired with HITL.
//
// AI-native policy-as-code, not a scheme register: an officer models a coverage lever for a scheme
// (raise coverage from X% to Y% over a population at a unit cost); the Policy Engine (lib/ai/engines/
// policy, Engine 4 of 6) projects the newly-covered beneficiaries, the indicative cost and an equity
// note — deterministic, explainable, humanAuthority. A SANCTIONING AUTHORITY then approves or rejects
// the proposal with a sanctioned budget (AI projects, a human decides). The projection is derived on
// read (never stored) so it is always reproducible.

import { projectPolicy, type PolicyProjection } from "@/lib/ai/engines/policy"

export { type PolicyProjection }

export const SCOPE_TIERS = ["State", "District", "Block", "Cluster", "School"] as const
export type ScopeTier = (typeof SCOPE_TIERS)[number]

export const PROPOSAL_STATUSES = ["AI Draft", "Submitted", "Sanctioned", "Rejected"] as const
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number]

export interface PolicyProposal {
  id: string
  title: string
  scheme: string
  scope: string
  population: number
  baselineCoveragePct: number
  unitCost: number
  targetCoveragePct: number
  equityWeighted: boolean
  status: ProposalStatus
  decidedBy: string
  sanctionedBudget: number
  notes: string
  createdAt: string
  updatedAt: string
}

export interface ProposalInput {
  title: string
  scheme: string
  scope: string
  population: number
  baselineCoveragePct: number
  unitCost: number
  targetCoveragePct: number
  equityWeighted: boolean
  status: ProposalStatus
  decidedBy: string
  sanctionedBudget: number
  notes: string
}

export function emptyProposal(): ProposalInput {
  return {
    title: "", scheme: "", scope: "District", population: 100000, baselineCoveragePct: 60, unitCost: 1000,
    targetCoveragePct: 85, equityWeighted: true, status: "AI Draft", decidedBy: "", sanctionedBudget: 0, notes: "",
  }
}

/** Run the Policy Engine over the baseline + lever — genuinely calls Engine 4, not a re-impl. */
export function project(p: Pick<PolicyProposal, "title" | "population" | "baselineCoveragePct" | "unitCost" | "targetCoveragePct" | "equityWeighted">): PolicyProjection {
  return projectPolicy(
    { population: Math.max(0, p.population || 0), baselineCoverage: (p.baselineCoveragePct || 0) / 100, unitCost: Math.max(0, p.unitCost || 0) },
    { label: p.title || "Policy lever", targetCoverage: (p.targetCoveragePct || 0) / 100, equityWeighted: p.equityWeighted },
  )
}

export function inr(rupees: number): string {
  if (rupees >= 1e7) return `₹${(rupees / 1e7).toFixed(2)} Cr`
  if (rupees >= 1e5) return `₹${(rupees / 1e5).toFixed(2)} L`
  return `₹${Math.round(rupees).toLocaleString("en-IN")}`
}

export type ProposalErrors = Partial<Record<keyof ProposalInput, string>>

export function validateProposal(f: ProposalInput): { ok: boolean; errors: ProposalErrors } {
  const e: ProposalErrors = {}
  if (!f.title.trim()) e.title = "Title is required"
  if (!f.scheme.trim()) e.scheme = "Scheme is required"
  if (!(SCOPE_TIERS as readonly string[]).includes(f.scope)) e.scope = "Select the scope"
  if (!Number.isFinite(f.population) || f.population <= 0) e.population = "Population must be greater than 0"
  if (!Number.isFinite(f.baselineCoveragePct) || f.baselineCoveragePct < 0 || f.baselineCoveragePct > 100) e.baselineCoveragePct = "Baseline must be 0–100%"
  if (!Number.isFinite(f.unitCost) || f.unitCost < 0) e.unitCost = "Unit cost cannot be negative"
  if (!Number.isFinite(f.targetCoveragePct) || f.targetCoveragePct < 0 || f.targetCoveragePct > 100) e.targetCoveragePct = "Target must be 0–100%"
  else if (Number.isFinite(f.baselineCoveragePct) && f.targetCoveragePct < f.baselineCoveragePct) e.targetCoveragePct = "Target should be at or above the baseline"
  if (!(PROPOSAL_STATUSES as readonly string[]).includes(f.status)) e.status = "Select a status"
  if ((f.status === "Sanctioned" || f.status === "Rejected") && !f.decidedBy.trim()) e.decidedBy = "Sanctioning authority is required for a decision"
  if (!Number.isFinite(f.sanctionedBudget) || f.sanctionedBudget < 0) e.sanctionedBudget = "Sanctioned budget cannot be negative"
  return { ok: Object.keys(e).length === 0, errors: e }
}

export interface ProposalFilters {
  query?: string
  scheme?: string
  scope?: string
  status?: string
  sortBy?: "title" | "impact"
  sortDir?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export interface ProposalSummary {
  total: number
  sanctioned: number
  pending: number
  projectedBeneficiaries: number
  projectedCost: number
}

export interface ProposalPage {
  proposals: PolicyProposal[]
  total: number
  totalPages: number
  page: number
  pageSize: number
  summary: ProposalSummary
}

const DEFAULT_PAGE_SIZE = 9

export function proposalSummary(all: PolicyProposal[]): ProposalSummary {
  let sanctioned = 0, pending = 0, projectedBeneficiaries = 0, projectedCost = 0
  for (const p of all) {
    if (p.status === "Sanctioned") sanctioned++
    if (p.status === "AI Draft" || p.status === "Submitted") pending++
    const proj = project(p)
    projectedBeneficiaries += proj.newlyCovered
    projectedCost += proj.indicativeCost
  }
  return { total: all.length, sanctioned, pending, projectedBeneficiaries, projectedCost }
}

export function queryProposals(all: PolicyProposal[], f: ProposalFilters = {}): ProposalPage {
  const q = (f.query ?? "").trim().toLowerCase()
  let rows = all.filter((p) => {
    if (q && !(`${p.title} ${p.scheme}`.toLowerCase().includes(q))) return false
    if (f.scheme && p.scheme !== f.scheme) return false
    if (f.scope && p.scope !== f.scope) return false
    if (f.status && p.status !== f.status) return false
    return true
  })
  const summary = proposalSummary(rows)
  const dir = f.sortDir === "asc" ? 1 : -1
  const by = f.sortBy ?? "impact"
  rows = [...rows].sort((a, b) => {
    if (by === "impact") return (project(a).newlyCovered - project(b).newlyCovered) * dir
    return a.title < b.title ? -dir : a.title > b.title ? dir : 0
  })
  const pageSize = f.pageSize && f.pageSize > 0 ? f.pageSize : DEFAULT_PAGE_SIZE
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, f.page ?? 1), totalPages)
  const start = (page - 1) * pageSize
  return { proposals: rows.slice(start, start + pageSize), total, totalPages, page, pageSize, summary }
}
