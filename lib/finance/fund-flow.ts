// VASA-EOS(SE) — PFMS scheme fund-flow view (pure logic).
//
// Turns a raw PFMS expenditure record (allocated / released / utilised, in rupees) into a
// dashboard-ready view: what share of the allocation has been released to the implementing agency,
// what share of the released funds has actually been utilised, and how much released money is still
// unspent. Pure + client-safe so the same maths runs in tests and on the fund-flow page.

import type { PfmsExpenditure } from "@/lib/integrations/types"

/** TN scheme heads tracked on the fund-flow page (codes passed to the PFMS port). */
export const TRACKED_SCHEMES = [
  "Samagra Shiksha",
  "PM POSHAN (Mid-Day Meal)",
  "Pudhumai Penn",
  "CM Breakfast Scheme",
  "PM SHRI",
] as const

export interface FundFlowView {
  scheme: string
  allocated: number
  released: number
  utilised: number
  /** released / allocated (%). */
  releasePct: number
  /** utilised / released (%). */
  utilisationPct: number
  /** Released funds not yet utilised (never negative). */
  unspent: number
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export function fundFlowView(e: PfmsExpenditure): FundFlowView {
  const releasePct = e.allocated === 0 ? 0 : round1((e.released / e.allocated) * 100)
  const utilisationPct = e.released === 0 ? 0 : round1((e.utilised / e.released) * 100)
  return {
    scheme: e.scheme,
    allocated: e.allocated,
    released: e.released,
    utilised: e.utilised,
    releasePct,
    utilisationPct,
    unspent: Math.max(e.released - e.utilised, 0),
  }
}

/** Compact crore formatting for budget figures, e.g. 100000000 → "₹10.00 Cr". */
export function inrCrore(rupees: number): string {
  return `₹${(rupees / 10000000).toFixed(2)} Cr`
}

/** Badge styling for a PFMS sanction status (utilised/released are "good", pending is open). */
export function sanctionBadgeVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "utilised" || status === "released") return "default"
  if (status === "sanctioned") return "secondary"
  return "outline"
}
