// VASA-EOS(SE) — Scheme Fund-Flow Ledger (the LOCAL books for centrally/state-sponsored schemes).
//
// PFMS is the national source of truth for scheme money (allocated → released → utilised). To
// "federate, never duplicate" the platform keeps its own local ledger of what the implementing
// agency recorded, then reconciles it against PFMS to surface fund-flow drift (potential leakage or
// mis-posting). This is the durable LOCAL master that reconciliation compares against. Pure +
// client-safe model/validation; money is held in whole rupees.

export const FUND_TIERS = ["State", "District", "Block", "School"] as const
export type FundTier = (typeof FUND_TIERS)[number]

export const SCHEME_CODES = ["SAMAGRA-SHIKSHA", "PM-POSHAN", "PUDHUMAI-PENN", "CM-BREAKFAST", "PM-SHRI", "RTE-REIMBURSEMENT"] as const

export interface FundLedgerRecord {
  id: string
  schemeCode: string
  schemeName: string
  financialYear: string
  tier: FundTier
  /** Whole rupees. Invariant: allocated ≥ released ≥ utilised. */
  allocated: number
  released: number
  utilised: number
  asOf: string
  notes: string
  tenantId: string
  createdAt: string
  updatedAt: string
}

export interface FundLedgerInput {
  schemeCode: string
  schemeName: string
  financialYear: string
  tier: FundTier
  allocated: number
  released: number
  utilised: number
  asOf: string
  notes: string
}

export function emptyFundLedger(): FundLedgerInput {
  return { schemeCode: "SAMAGRA-SHIKSHA", schemeName: "Samagra Shiksha", financialYear: "2025-26", tier: "State", allocated: 0, released: 0, utilised: 0, asOf: new Date().toISOString().slice(0, 10), notes: "" }
}

export type FundLedgerErrors = Partial<Record<keyof FundLedgerInput, string>>

const FY_RE = /^\d{4}-\d{2}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function validateFundLedger(f: FundLedgerInput): { ok: boolean; errors: FundLedgerErrors } {
  const e: FundLedgerErrors = {}
  if (!f.schemeCode.trim()) e.schemeCode = "Scheme code is required"
  if (!f.schemeName.trim()) e.schemeName = "Scheme name is required"
  if (!FY_RE.test(f.financialYear.trim())) e.financialYear = "Use a financial year like 2025-26"
  if (!(FUND_TIERS as readonly string[]).includes(f.tier)) e.tier = "Select the tier"
  if (!DATE_RE.test(f.asOf.trim())) e.asOf = "Use a date like 2026-06-30"
  for (const k of ["allocated", "released", "utilised"] as const) {
    if (!Number.isFinite(f[k]) || f[k] < 0) e[k] = "Enter a non-negative amount"
  }
  // Fund-flow invariant: you cannot release more than allocated, nor utilise more than released.
  if (!e.released && !e.allocated && f.released > f.allocated) e.released = "Released cannot exceed allocated"
  if (!e.utilised && !e.released && f.utilised > f.released) e.utilised = "Utilised cannot exceed released"
  return { ok: Object.keys(e).length === 0, errors: e }
}

export interface FundLedgerView extends FundLedgerRecord {
  /** released / allocated, whole %. */
  releaseRate: number
  /** utilised / released, whole %. */
  utilisationPct: number
  /** allocated − released (sanctioned but not released). */
  unreleased: number
  /** released − utilised (released but not spent — the parking/leakage risk). */
  unspent: number
}

export function view(r: FundLedgerRecord): FundLedgerView {
  const releaseRate = r.allocated === 0 ? 0 : Math.round((r.released / r.allocated) * 100)
  const utilisationPct = r.released === 0 ? 0 : Math.round((r.utilised / r.released) * 100)
  return { ...r, releaseRate, utilisationPct, unreleased: r.allocated - r.released, unspent: r.released - r.utilised }
}

export interface FundFilters {
  query?: string
  scheme?: string
  tier?: string
  financialYear?: string
  sortBy?: "allocated" | "utilisation" | "scheme"
  sortDir?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export interface FundSummary {
  total: number
  allocated: number
  released: number
  utilised: number
  /** Aggregate utilisation = sum(utilised) / sum(released), whole %. */
  utilisationPct: number
  /** Records utilising under 50% of released funds (parked-money watchlist). */
  lowUtilisation: number
}

const DEFAULT_PAGE_SIZE = 10

export function fundSummary(all: FundLedgerRecord[]): FundSummary {
  const allocated = all.reduce((s, r) => s + r.allocated, 0)
  const released = all.reduce((s, r) => s + r.released, 0)
  const utilised = all.reduce((s, r) => s + r.utilised, 0)
  const utilisationPct = released === 0 ? 0 : Math.round((utilised / released) * 100)
  const lowUtilisation = all.filter((r) => view(r).utilisationPct < 50).length
  return { total: all.length, allocated, released, utilised, utilisationPct, lowUtilisation }
}

export function queryFunds(all: FundLedgerRecord[], f: FundFilters = {}): { rows: FundLedgerView[]; total: number; totalPages: number; page: number; pageSize: number; summary: FundSummary } {
  const q = (f.query ?? "").trim().toLowerCase()
  let rows = all.filter((r) => {
    if (q && !(`${r.schemeCode} ${r.schemeName}`.toLowerCase().includes(q))) return false
    if (f.scheme && r.schemeCode !== f.scheme) return false
    if (f.tier && r.tier !== f.tier) return false
    if (f.financialYear && r.financialYear !== f.financialYear) return false
    return true
  })
  const summary = fundSummary(rows)
  const dir = f.sortDir === "asc" ? 1 : -1
  const by = f.sortBy ?? "allocated"
  rows = [...rows].sort((a, b) => {
    if (by === "scheme") return a.schemeName.localeCompare(b.schemeName) * dir
    if (by === "utilisation") return (view(a).utilisationPct - view(b).utilisationPct) * dir
    return (a.allocated - b.allocated) * dir
  })
  const pageSize = f.pageSize && f.pageSize > 0 ? f.pageSize : DEFAULT_PAGE_SIZE
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, f.page ?? 1), totalPages)
  const start = (page - 1) * pageSize
  return { rows: rows.slice(start, start + pageSize).map(view), total, totalPages, page, pageSize, summary }
}
