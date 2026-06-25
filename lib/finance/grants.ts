// VASA-EOS(SE) — grants management & utilisation-certificate gating (Module Catalogue v3.0 — State tier).
//
// Centrally-sponsored grants (Samagra Shiksha, PM POSHAN, PM SHRI, STARS) release in tranches, and the next
// tranche is GATED: a state cannot draw more until it has utilised enough of what it holds and filed a
// Utilisation Certificate (UC). This models that gate — utilisation against released funds, UC status, and
// whether the next tranche is releasable — with an honest block reason where it is not. Sample grants seeded;
// real ledgers persist behind getDb(). Pure + client-safe.

import { csvField } from "@/lib/csv"

/** Minimum utilisation (% of released funds) required before the next tranche releases. */
export const UTILISATION_THRESHOLD = 60

export interface Grant {
  id: string
  scheme: string
  /** Total sanctioned for the year (₹). */
  sanctioned: number
  /** Released so far (₹). */
  released: number
  /** Utilised against releases (₹). */
  utilised: number
  /** Whether the Utilisation Certificate for prior releases has been filed. */
  ucSubmitted: boolean
}

export const GRANTS: Grant[] = [
  { id: "GR-SS-2026", scheme: "Samagra Shiksha", sanctioned: 12000000, released: 8000000, utilised: 5600000, ucSubmitted: true },
  { id: "GR-PP-2026", scheme: "PM POSHAN / CMBS", sanctioned: 9000000, released: 6000000, utilised: 5400000, ucSubmitted: true },
  { id: "GR-SHRI-2026", scheme: "PM SHRI", sanctioned: 6000000, released: 3000000, utilised: 1200000, ucSubmitted: false },
  { id: "GR-STARS-2026", scheme: "STARS (World Bank)", sanctioned: 5000000, released: 2500000, utilised: 900000, ucSubmitted: true },
  { id: "GR-LIB-2026", scheme: "Library & TLM grant", sanctioned: 1500000, released: 1500000, utilised: 1100000, ucSubmitted: true },
  { id: "GR-CPD-2026", scheme: "Teacher CPD grant", sanctioned: 2000000, released: 1200000, utilised: 980000, ucSubmitted: true },
]

export function grantById(id: string): Grant | undefined {
  return GRANTS.find((g) => g.id === id)
}

export function utilisationPct(g: Grant): number {
  return g.released > 0 ? Math.round((g.utilised / g.released) * 100) : 0
}

export function unspent(g: Grant): number {
  return Math.max(0, g.released - g.utilised)
}

export function fullyReleased(g: Grant): boolean {
  return g.released >= g.sanctioned
}

/** The next tranche releases only on sufficient utilisation AND a filed UC, with funds still to release. */
export function nextTrancheEligible(g: Grant): boolean {
  return !fullyReleased(g) && g.ucSubmitted && utilisationPct(g) >= UTILISATION_THRESHOLD
}

/** Why the next tranche is (not) releasable. */
export function trancheStatus(g: Grant): string {
  if (fullyReleased(g)) return "fully released"
  if (!g.ucSubmitted) return "UC pending"
  if (utilisationPct(g) < UTILISATION_THRESHOLD) return `utilisation below ${UTILISATION_THRESHOLD}%`
  return "eligible for next tranche"
}

export interface GrantsSummary {
  grants: number
  totalSanctioned: number
  totalReleased: number
  totalUtilised: number
  /** Average utilisation of released funds, 0–100. */
  avgUtilisationPct: number
  eligibleForRelease: number
  ucPending: number
}

export function grantsSummary(items: Grant[] = GRANTS): GrantsSummary {
  const released = items.reduce((s, g) => s + g.released, 0)
  const utilised = items.reduce((s, g) => s + g.utilised, 0)
  return {
    grants: items.length,
    totalSanctioned: items.reduce((s, g) => s + g.sanctioned, 0),
    totalReleased: released,
    totalUtilised: utilised,
    avgUtilisationPct: released > 0 ? Math.round((utilised / released) * 100) : 0,
    eligibleForRelease: items.filter((g) => nextTrancheEligible(g)).length,
    ucPending: items.filter((g) => !g.ucSubmitted).length,
  }
}


export function toCSV(items: Grant[] = GRANTS): string {
  const header = ["ID", "Scheme", "Sanctioned", "Released", "Utilised", "Utilisation %", "UC", "Tranche status"]
  const rows = items.map((g) =>
    [g.id, g.scheme, String(g.sanctioned), String(g.released), String(g.utilised), String(utilisationPct(g)), g.ucSubmitted ? "filed" : "pending", trancheStatus(g)].map(csvField).join(","),
  )
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
