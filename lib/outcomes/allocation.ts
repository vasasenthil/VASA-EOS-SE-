// VASA-EOS(SE) — Equity-weighted, EVIDENCE-FED resource allocation (drives off measured outcomes).
//
// The brief commits to "equity-weighted resource allocation — evidence-fed prioritisation … to where
// the gap actually is". A static "need index" is a guess; this derives need from the MEASURED
// per-district Quality Index (lib/outcomes): a district scoring worse on real outcomes carries more
// need, and draws a larger per-student share of the envelope. "Equal" is not "equitable" — so the
// progressivity ratio (per-student share of the highest-need vs lowest-need district) is surfaced so
// the politics of the split are visible and auditable. Pure + deterministic.

import { indexByDimension, type OutcomeRecord } from "./index"

export interface AllocationLine {
  district: string
  /** Measured Quality Index (0-100) for the district. */
  index: number
  /** Students in the district cohort. */
  cohort: number
  /** Evidence-fed need (100 − index): worse outcomes → more need. */
  need: number
  /** Allocation weight = cohort × (1 + need/100). */
  weight: number
  /** Rupees allocated to the district. */
  share: number
  /** Rupees per student. */
  perStudent: number
}

export interface AllocationPlan {
  pool: number
  totalCohort: number
  /** Lines sorted by need descending — the priority order resources should follow. */
  lines: AllocationLine[]
  /** A flat per-student baseline (pool ÷ total cohort) for comparison with the equity split. */
  equalPerStudent: number
  /** per-student(highest-need) ÷ per-student(lowest-need), 2dp. >1 means progressive. */
  progressivity: number
  /** The district that should be served first. */
  topPriority: string
}

const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n))

/**
 * Distribute `pool` rupees across districts by an evidence-fed, equity weight. Need is derived from
 * the measured Quality Index — no manual need-index. Returns the priority-ordered plan. Pure.
 */
export function equityAllocation(records: OutcomeRecord[], pool: number): AllocationPlan {
  const districts = indexByDimension(records, "district").filter((d) => d.cohort > 0)
  const totalCohort = districts.reduce((s, d) => s + d.cohort, 0)
  const weighted = districts.map((d) => {
    const need = clamp(100 - d.index, 0, 100)
    return { district: d.value, index: d.index, cohort: d.cohort, need, weight: d.cohort * (1 + need / 100) }
  })
  const totalWeight = weighted.reduce((s, d) => s + d.weight, 0)
  const lines: AllocationLine[] = weighted
    .map((d) => {
      const share = totalWeight === 0 ? 0 : Math.round((pool * d.weight) / totalWeight)
      return { ...d, share, perStudent: d.cohort === 0 ? 0 : Math.round(share / d.cohort) }
    })
    .sort((a, b) => b.need - a.need || a.district.localeCompare(b.district))

  const equalPerStudent = totalCohort === 0 ? 0 : Math.round(pool / totalCohort)
  const highest = lines[0]
  const lowest = lines[lines.length - 1]
  const progressivity = lines.length >= 2 && lowest.perStudent > 0 ? Math.round((highest.perStudent / lowest.perStudent) * 100) / 100 : 1
  return { pool, totalCohort, lines, equalPerStudent, progressivity, topPriority: highest ? highest.district : "" }
}
