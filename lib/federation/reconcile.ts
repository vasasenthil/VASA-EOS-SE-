// VASA-EOS(SE) — Federation reconciliation: field-level drift detection (L4, AI-native, advisory).
//
// "Federate, never duplicate" only works if the platform can TELL when its local copy has drifted
// from the national source of truth. This pure engine compares an upstream registry record against
// the matching local record field by field, classifies each field (match / drift / missing on one
// side) and produces an explainable advisory recommendation — Reconciled, Review or Flagged.
//
// It is advisory only: a human reconciler decides (HITL). The engine never mutates anything; it just
// makes the discrepancy visible and reasoned, the way the AI engines do. Deterministic + client-safe.

import type { ApaarRecord } from "@/lib/integrations/types"
import type { StudentRecord } from "@/lib/students"

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
