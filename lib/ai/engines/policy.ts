// VASA-EOS(SE) — Policy Engine (Engine 4 of 6).
//
// Policy-as-code impact projection: given a baseline population (size, current coverage,
// per-beneficiary unit cost) and a policy lever (target coverage change), it projects the
// newly-covered beneficiaries, the indicative cost, and an equity note. Deterministic
// arithmetic with an explanation. Advisory: it informs a sanctioning authority's decision.

export interface PopulationBaseline {
  /** Eligible population (e.g. students in a scheme's ambit). */
  population: number
  /** Current coverage fraction in [0,1]. */
  baselineCoverage: number
  /** Indicative cost per newly-covered beneficiary, in ₹. */
  unitCost: number
}

export interface PolicyLever {
  label: string
  /** Target coverage fraction in [0,1] (clamped; must exceed baseline to have effect). */
  targetCoverage: number
  /** Optional priority weighting for under-served groups (informational). */
  equityWeighted?: boolean
}

export interface PolicyProjection {
  newlyCovered: number
  projectedCoverage: number
  indicativeCost: number
  equityNote: string
  confidence: number
  explanation: string
  humanAuthority: true
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x))
}

export function projectPolicy(baseline: PopulationBaseline, lever: PolicyLever): PolicyProjection {
  const base = clamp01(baseline.baselineCoverage)
  const target = clamp01(lever.targetCoverage)
  const delta = Math.max(0, target - base)
  const newlyCovered = Math.round(baseline.population * delta)
  const indicativeCost = Math.max(0, Math.round(newlyCovered * baseline.unitCost))
  const projectedCoverage = base + delta
  const equityNote = lever.equityWeighted
    ? "Equity-weighted: prioritise the newly-covered toward the most under-served blocks."
    : "Uniform expansion; consider equity weighting for under-served blocks."
  const explanation =
    delta > 0
      ? `"${lever.label}" lifts coverage ${(base * 100).toFixed(0)}% → ${(projectedCoverage * 100).toFixed(0)}%, covering ${newlyCovered.toLocaleString("en-IN")} more at ~₹${indicativeCost.toLocaleString("en-IN")}.`
      : `"${lever.label}" sets a target at or below current coverage — no additional beneficiaries.`
  return {
    newlyCovered,
    projectedCoverage,
    indicativeCost,
    equityNote,
    confidence: baseline.population > 0 ? 1 : 0,
    explanation,
    humanAuthority: true,
  }
}
