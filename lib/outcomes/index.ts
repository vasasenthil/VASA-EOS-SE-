// VASA-EOS(SE) — Outcome instrumentation: TN School Education Quality Index + Opportunity-Gap Index.
//
// The Synthesis Brief commits to PUBLISHED, disaggregated outcomes: "one Tamil Nadu School Education
// Quality Index, disaggregated by district, block, school category, gender, social category and
// disability", and an "Opportunity-gap index … that compares outcomes across rural-urban,
// government-private, social-category and gender lines — and shrinks under scrutiny".
//
// This is the computation core: a cohort outcome record carries component metrics (FLN, attendance,
// transition, pass) and a cohort size; the Quality Index is their weighted composite; disaggregation
// recomputes the index for any dimension (cohort-weighted); the Opportunity-Gap is the spread between
// the best- and worst-served groups on a dimension — lower is more equitable. Pure + deterministic.

export const SCHOOL_CATEGORIES = ["Government", "Aided", "Matriculation", "Private", "CBSE"] as const
export type SchoolCategory = (typeof SCHOOL_CATEGORIES)[number]

export const AREAS = ["Rural", "Urban"] as const
export type Area = (typeof AREAS)[number]

export const GENDERS = ["Female", "Male", "Transgender"] as const
export type Gender = (typeof GENDERS)[number]

export const SOCIAL_CATEGORIES = ["SC", "ST", "OBC", "MBC", "General"] as const
export type SocialCategory = (typeof SOCIAL_CATEGORIES)[number]

export interface OutcomeRecord {
  id: string
  term: string
  district: string
  schoolCategory: SchoolCategory
  area: Area
  gender: Gender
  socialCategory: SocialCategory
  /** Persons-with-disability cohort flag (for RPwD disaggregation). */
  pwd: boolean
  // Component outcome metrics, each 0-100:
  flnPct: number // foundational literacy & numeracy attainment (NIPUN-aligned)
  attendancePct: number
  transitionPct: number // progression to the next grade/stage
  passPct: number // board/term pass rate
  cohortSize: number
}

export interface OutcomeMetrics {
  flnPct: number
  attendancePct: number
  transitionPct: number
  passPct: number
}

/** Composite weights (sum = 1). FLN is weighted highest — it is the foundational outcome. */
export const QUALITY_WEIGHTS = { fln: 0.35, attendance: 0.2, transition: 0.2, pass: 0.25 } as const

/** The Quality Index (0-100) for a set of component metrics. Pure. */
export function qualityIndex(m: OutcomeMetrics): number {
  return Math.round(m.flnPct * QUALITY_WEIGHTS.fln + m.attendancePct * QUALITY_WEIGHTS.attendance + m.transitionPct * QUALITY_WEIGHTS.transition + m.passPct * QUALITY_WEIGHTS.pass)
}

/** Cohort-size-weighted average of each component metric across records. Pure. */
export function aggregateMetrics(records: OutcomeRecord[]): OutcomeMetrics {
  const totalCohort = records.reduce((s, r) => s + r.cohortSize, 0)
  if (totalCohort === 0) return { flnPct: 0, attendancePct: 0, transitionPct: 0, passPct: 0 }
  const w = (sel: (r: OutcomeRecord) => number) => records.reduce((s, r) => s + sel(r) * r.cohortSize, 0) / totalCohort
  return {
    flnPct: Math.round(w((r) => r.flnPct)),
    attendancePct: Math.round(w((r) => r.attendancePct)),
    transitionPct: Math.round(w((r) => r.transitionPct)),
    passPct: Math.round(w((r) => r.passPct)),
  }
}

/** The headline, cohort-weighted TN Quality Index over a set of records. */
export function overallIndex(records: OutcomeRecord[]): number {
  return qualityIndex(aggregateMetrics(records))
}

export type Dimension = "district" | "schoolCategory" | "area" | "gender" | "socialCategory" | "disability"

export const DIMENSIONS: Dimension[] = ["district", "schoolCategory", "area", "gender", "socialCategory", "disability"]

export function dimensionValue(r: OutcomeRecord, dim: Dimension): string {
  if (dim === "disability") return r.pwd ? "PwD" : "Non-PwD"
  return String(r[dim])
}

export interface DimensionIndex {
  value: string
  index: number
  cohort: number
}

/** The Quality Index recomputed for each value of a dimension (cohort-weighted), highest first. */
export function indexByDimension(records: OutcomeRecord[], dim: Dimension): DimensionIndex[] {
  const groups = new Map<string, OutcomeRecord[]>()
  for (const r of records) {
    const v = dimensionValue(r, dim)
    const g = groups.get(v)
    if (g) g.push(r)
    else groups.set(v, [r])
  }
  return [...groups.entries()]
    .map(([value, rs]) => ({ value, index: overallIndex(rs), cohort: rs.reduce((s, r) => s + r.cohortSize, 0) }))
    .sort((a, b) => b.index - a.index)
}

export interface OpportunityGap {
  dimension: Dimension
  highest: DimensionIndex
  lowest: DimensionIndex
  /** Points between the best- and worst-served group. Lower = more equitable. */
  gap: number
}

/** The Opportunity-Gap on a dimension: the spread between its best- and worst-served groups. */
export function opportunityGap(records: OutcomeRecord[], dim: Dimension): OpportunityGap | null {
  const rows = indexByDimension(records, dim).filter((r) => r.cohort > 0)
  if (rows.length < 2) return null
  const highest = rows[0]
  const lowest = rows[rows.length - 1]
  return { dimension: dim, highest, lowest, gap: highest.index - lowest.index }
}

export interface OutcomeReport {
  overall: number
  metrics: OutcomeMetrics
  cohort: number
  records: number
  /** The Opportunity-Gap Index across the equity-critical dimensions the brief names. */
  gaps: OpportunityGap[]
  /** The largest single gap — the headline inequity to shrink. */
  widestGap: OpportunityGap | null
}

/** The published outcome report: headline index, component metrics, and the opportunity-gap set. */
export function outcomeReport(records: OutcomeRecord[]): OutcomeReport {
  const gapDims: Dimension[] = ["area", "schoolCategory", "socialCategory", "gender", "disability"]
  const gaps = gapDims.map((d) => opportunityGap(records, d)).filter((g): g is OpportunityGap => g !== null)
  const widestGap = gaps.length ? gaps.reduce((a, b) => (b.gap > a.gap ? b : a)) : null
  return {
    overall: overallIndex(records),
    metrics: aggregateMetrics(records),
    cohort: records.reduce((s, r) => s + r.cohortSize, 0),
    records: records.length,
    gaps,
    widestGap,
  }
}

export interface OutcomeInput {
  term: string
  district: string
  schoolCategory: SchoolCategory
  area: Area
  gender: Gender
  socialCategory: SocialCategory
  pwd: boolean
  flnPct: number
  attendancePct: number
  transitionPct: number
  passPct: number
  cohortSize: number
}

export function emptyOutcome(): OutcomeInput {
  return { term: "2025-26 T2", district: "Chennai", schoolCategory: "Government", area: "Urban", gender: "Female", socialCategory: "General", pwd: false, flnPct: 0, attendancePct: 0, transitionPct: 0, passPct: 0, cohortSize: 0 }
}

export type OutcomeErrors = Partial<Record<keyof OutcomeInput, string>>

export function validateOutcome(f: OutcomeInput): { ok: boolean; errors: OutcomeErrors } {
  const e: OutcomeErrors = {}
  if (!f.term.trim()) e.term = "Term is required"
  if (!f.district.trim()) e.district = "District is required"
  for (const k of ["flnPct", "attendancePct", "transitionPct", "passPct"] as const) {
    if (!Number.isFinite(f[k]) || f[k] < 0 || f[k] > 100) e[k] = "Enter a percentage 0–100"
  }
  if (!Number.isInteger(f.cohortSize) || f.cohortSize < 1) e.cohortSize = "Cohort size must be a positive whole number"
  return { ok: Object.keys(e).length === 0, errors: e }
}
