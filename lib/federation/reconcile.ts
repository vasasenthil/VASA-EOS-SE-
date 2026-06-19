// VASA-EOS(SE) — Federation reconciliation: field-level drift detection (L4, AI-native, advisory).
//
// "Federate, never duplicate" only works if the platform can TELL when its local copy has drifted
// from the national source of truth. This pure engine compares an upstream registry record against
// the matching local record field by field, classifies each field (match / drift / missing on one
// side) and produces an explainable advisory recommendation — Reconciled, Review or Flagged.
//
// It is advisory only: a human reconciler decides (HITL). The engine never mutates anything; it just
// makes the discrepancy visible and reasoned, the way the AI engines do. Deterministic + client-safe.

import type { ApaarRecord, EmisSchoolData } from "@/lib/integrations/types"
import type { StudentRecord } from "@/lib/students"
import type { EnrolmentRecord } from "@/lib/enrolment/store"

export type FieldState = "match" | "drift" | "missing-upstream" | "missing-local"

export interface FieldComparison {
  field: string
  label: string
  upstream: string
  local: string
  state: FieldState
  /** Identity-critical fields (name, date of birth) escalate a drift to a Flag. */
  critical: boolean
}

export const RECONCILE_RECOMMENDATIONS = ["Reconciled", "Review", "Flagged"] as const
export type ReconcileRecommendation = (typeof RECONCILE_RECOMMENDATIONS)[number]

export interface ReconcileReport {
  recommendation: ReconcileRecommendation
  rationale: string
  fields: FieldComparison[]
  /** Fields with at least one side present (the basis for matchPct). */
  comparable: number
  matches: number
  driftCount: number
  criticalDriftCount: number
  /** Whole-number percentage of comparable fields that agree. */
  matchPct: number
}

const norm = (v: string | undefined | null): string => (v ?? "").trim().toLowerCase()

/** Classify a single field given the (raw) upstream and local values. */
export function classifyField(upstream: string, local: string): FieldState {
  const u = norm(upstream)
  const l = norm(local)
  if (!u && !l) return "match" // nothing to compare → not a discrepancy
  if (!u) return "missing-upstream"
  if (!l) return "missing-local"
  return u === l ? "match" : "drift"
}

/** APAAR journeyStatus ↔ local StudentStatus, normalised so "enrolled" and "Enrolled" agree. */
export function mapJourneyToStatus(journey: string | undefined): string {
  switch (norm(journey)) {
    case "enrolled":
      return "Enrolled"
    case "transferred":
      return "Transferred"
    case "alumni":
      return "Graduated"
    case "dropout":
      return "Dropped"
    default:
      return ""
  }
}

/** Build the report (recommendation + totals) from a set of compared fields. Pure. */
export function buildReport(fields: FieldComparison[]): ReconcileReport {
  const comparable = fields.filter((f) => !(norm(f.upstream) === "" && norm(f.local) === "")).length
  const matches = fields.filter((f) => f.state === "match" && !(norm(f.upstream) === "" && norm(f.local) === "")).length
  const drifts = fields.filter((f) => f.state !== "match")
  const driftCount = drifts.length
  const criticalDriftCount = drifts.filter((f) => f.critical).length
  const matchPct = comparable === 0 ? 100 : Math.round((matches / comparable) * 100)

  let recommendation: ReconcileRecommendation
  let rationale: string
  if (criticalDriftCount > 0) {
    recommendation = "Flagged"
    rationale = `Identity-critical drift on ${drifts.filter((f) => f.critical).map((f) => f.label).join(", ")} — verify before trusting either copy.`
  } else if (driftCount > 0) {
    recommendation = "Review"
    rationale = `${driftCount} non-critical field(s) differ (${drifts.map((f) => f.label).join(", ")}); reconcile the local record to the source of truth.`
  } else {
    recommendation = "Reconciled"
    rationale = comparable === 0 ? "No overlapping fields to compare." : "Local record agrees with the source of truth on every compared field."
  }
  return { recommendation, rationale, fields, comparable, matches, driftCount, criticalDriftCount, matchPct }
}

/**
 * Compare an upstream APAAR record (source of truth) against the local student master record.
 * Identity-critical: name, date of birth. Advisory only — a human decides the reconciliation.
 */
export function compareApaarToStudent(upstream: ApaarRecord, local: StudentRecord): ReconcileReport {
  const rows: Array<{ field: string; label: string; u: string; l: string; critical: boolean }> = [
    { field: "apaarId", label: "APAAR id", u: upstream.apaarId ?? "", l: local.apaarId ?? "", critical: true },
    { field: "name", label: "Name", u: upstream.name ?? "", l: local.name ?? "", critical: true },
    { field: "dob", label: "Date of birth", u: upstream.dateOfBirth ?? "", l: local.dob ?? "", critical: true },
    { field: "gender", label: "Gender", u: upstream.gender ?? "", l: local.gender ?? "", critical: false },
    { field: "category", label: "Category", u: upstream.category ?? "", l: local.category ?? "", critical: false },
    { field: "status", label: "Journey / status", u: mapJourneyToStatus(upstream.journeyStatus), l: local.status ?? "", critical: false },
  ]
  const fields: FieldComparison[] = rows.map((r) => ({
    field: r.field,
    label: r.label,
    upstream: r.u,
    local: r.l,
    state: classifyField(r.u, r.l),
    critical: r.critical,
  }))
  return buildReport(fields)
}

// ── Numeric reconciliation (counts) — tolerance-aware, for EMIS/UDISE+ master-data ──────────────
//
// String equality is wrong for counts: a state EMIS snapshot lags the school roll by a few records,
// so a small percentage delta is "within tolerance", not a discrepancy. This comparator grades a
// numeric field as match / minor-drift / drift (or missing on either side) against a tolerance.

export type NumericState = "match" | "minor-drift" | "drift" | "missing-upstream" | "missing-local"

export interface NumericComparison {
  field: string
  label: string
  /** null = the side keeps no master for this field (→ missing). */
  upstream: number | null
  local: number | null
  /** local − upstream (0 when a side is missing). */
  delta: number
  /** |delta| / upstream as a whole-number percentage (0 when upstream is missing/zero). */
  pctDelta: number
  state: NumericState
  critical: boolean
}

export interface NumericReport {
  recommendation: ReconcileRecommendation
  rationale: string
  fields: NumericComparison[]
  comparable: number
  matches: number
  driftCount: number
  criticalDriftCount: number
  /** Tolerance (%) below which a non-zero delta is graded a minor-drift, not a drift. */
  tolerancePct: number
}

/** Default sync tolerance: deltas at or under this percentage are "minor", not a real discrepancy. */
export const DEFAULT_TOLERANCE_PCT = 2

export function classifyNumeric(upstream: number | null, local: number | null, tolerancePct = DEFAULT_TOLERANCE_PCT): NumericState {
  if (upstream === null && local === null) return "match"
  if (upstream === null) return "missing-upstream"
  if (local === null) return "missing-local"
  const delta = Math.abs(local - upstream)
  if (delta === 0) return "match"
  const pct = upstream === 0 ? 100 : (delta / upstream) * 100
  return pct <= tolerancePct ? "minor-drift" : "drift"
}

function numericField(field: string, label: string, upstream: number | null, local: number | null, critical: boolean, tolerancePct: number): NumericComparison {
  const state = classifyNumeric(upstream, local, tolerancePct)
  const both = upstream !== null && local !== null
  const delta = both ? local - upstream : 0
  const pctDelta = both && upstream !== 0 ? Math.round((Math.abs(delta) / upstream) * 100) : both && upstream === 0 ? 100 : 0
  return { field, label, upstream, local, delta, pctDelta, state, critical }
}

/** Build a numeric report (recommendation + totals). A "drift" (beyond tolerance) is a real discrepancy; a "minor-drift" is within tolerance and counts as agreement. Pure. */
export function buildNumericReport(fields: NumericComparison[], tolerancePct = DEFAULT_TOLERANCE_PCT): NumericReport {
  const comparable = fields.filter((f) => f.upstream !== null || f.local !== null).length
  const agree = fields.filter((f) => (f.state === "match" || f.state === "minor-drift") && (f.upstream !== null || f.local !== null))
  const matches = agree.length
  const drifts = fields.filter((f) => f.state === "drift" || f.state === "missing-upstream" || f.state === "missing-local")
  const realDrifts = fields.filter((f) => f.state === "drift")
  const criticalDriftCount = realDrifts.filter((f) => f.critical).length

  let recommendation: ReconcileRecommendation
  let rationale: string
  if (criticalDriftCount > 0) {
    recommendation = "Flagged"
    rationale = `Count drift beyond ${tolerancePct}% tolerance on ${realDrifts.filter((f) => f.critical).map((f) => f.label).join(", ")} — investigate the local roll against the state master.`
  } else if (realDrifts.length > 0) {
    recommendation = "Review"
    rationale = `${realDrifts.length} count(s) differ beyond tolerance (${realDrifts.map((f) => f.label).join(", ")}); reconcile with the state master.`
  } else {
    recommendation = "Reconciled"
    rationale = comparable === 0 ? "No overlapping counts to compare." : `Local counts agree with the state master within the ${tolerancePct}% sync tolerance.`
  }
  return { recommendation, rationale, fields, comparable, matches, driftCount: drifts.length, criticalDriftCount, tolerancePct }
}

/**
 * Reconcile the state EMIS master-data snapshot (counts) against the local school roll. Only the
 * on-roll student count has a local master (the enrolment snapshot); teachers/classrooms are shown
 * as upstream-only context (missing-local), honestly, rather than inventing a local figure.
 */
export function compareEmisToEnrolment(emis: EmisSchoolData, local: EnrolmentRecord | null, tolerancePct = DEFAULT_TOLERANCE_PCT): NumericReport {
  const fields: NumericComparison[] = [
    numericField("students", "Students on roll", emis.students, local ? local.total : null, true, tolerancePct),
    numericField("teachers", "Teachers", emis.teachers, null, false, tolerancePct),
    numericField("classrooms", "Classrooms", emis.classrooms, null, false, tolerancePct),
  ]
  return buildNumericReport(fields, tolerancePct)
}
