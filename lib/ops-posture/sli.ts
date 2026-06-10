// VASA-EOS(SE) — service-level indicators (SLI) & error budgets (Operations / observability).
//
// lib/ops-posture declares the SLO *targets*; this binds each to the SLI that measures
// it — what's observed, the measurement source (metric / probe / trace / ledger) and the
// monthly error budget derived from the target. Self-verified 1:1 against SLO_TARGETS
// (every objective has an indicator and vice-versa), and the error-budget arithmetic is
// unit-tested. Pure + client-safe. (Computing these live needs the OTel collector / log
// pipeline at deploy; the indicators and budgets are defined here.)

import { csvField } from "@/lib/csv"

import { SLO_TARGETS } from "./index"

export type SliSource = "metric" | "probe" | "trace" | "ledger"

export interface Sli {
  /** Must match an SLO_TARGETS.service. */
  service: string
  indicator: string
  source: SliSource
  /** Concrete metric / probe / formula that produces the indicator. */
  measurement: string
  /** Availability target % for error-budget math; null for latency/durability SLIs. */
  availabilityTarget: number | null
}

export const SLIS: Sli[] = [
  { service: "Public read APIs", indicator: "Successful responses ÷ total", source: "metric", measurement: "http_requests_total{status<500} ÷ http_requests_total (lib/metrics)", availabilityTarget: 99.5 },
  { service: "Authn / login", indicator: "Successful auth ÷ attempts", source: "metric", measurement: "auth_success_total ÷ auth_attempts_total (lib/metrics)", availabilityTarget: 99.9 },
  { service: "Dashboards (p95)", indicator: "95th-percentile render latency", source: "trace", measurement: "p95(dashboard_render_ms) from spans (lib/tracing)", availabilityTarget: null },
  { service: "Approval write actions (p95)", indicator: "95th-percentile write latency", source: "trace", measurement: "p95(action_ms) from spans (lib/tracing)", availabilityTarget: null },
  { service: "Audit ledger append", indicator: "Append durability & chain integrity", source: "ledger", measurement: "vasa_audit_events_total + verifyTrail() hash-chain (lib/audit)", availabilityTarget: null },
  { service: "Health probes", indicator: "Ready-status ratio", source: "probe", measurement: "buildReadiness().status == 'ready' ratio (lib/readiness)", availabilityTarget: 99.95 },
]

/** Minutes of allowed unavailability per 30-day month for an availability target. */
export function monthlyErrorBudgetMinutes(pct: number): number {
  return Math.round((1 - pct / 100) * 30 * 24 * 60)
}

export function errorBudgetLabel(sli: Sli): string {
  if (sli.availabilityTarget === null) return "—"
  return `${monthlyErrorBudgetMinutes(sli.availabilityTarget)} min/month`
}

export function sliFor(service: string): Sli | undefined {
  return SLIS.find((s) => s.service === service)
}

/** SLO services with no SLI (should be none). */
export function uncoveredSlos(): string[] {
  const covered = new Set(SLIS.map((s) => s.service))
  return SLO_TARGETS.filter((t) => !covered.has(t.service)).map((t) => t.service)
}

/** SLIs whose service does not match a declared SLO (should be none). */
export function orphanSlis(): string[] {
  const known = new Set(SLO_TARGETS.map((t) => t.service))
  return SLIS.filter((s) => !known.has(s.service)).map((s) => s.service)
}

export interface SliSummary {
  slis: number
  availabilitySlis: number
  latencySlis: number
  /** Tightest (smallest) monthly error budget in minutes, for at-a-glance. */
  tightestBudgetMinutes: number
}

export function sliSummary(items: Sli[] = SLIS): SliSummary {
  const budgets = items
    .filter((s) => s.availabilityTarget !== null)
    .map((s) => monthlyErrorBudgetMinutes(s.availabilityTarget as number))
  return {
    slis: items.length,
    availabilitySlis: items.filter((s) => s.availabilityTarget !== null).length,
    latencySlis: items.filter((s) => s.source === "trace").length,
    tightestBudgetMinutes: budgets.length ? Math.min(...budgets) : 0,
  }
}


export function toCSV(items: Sli[] = SLIS): string {
  const header = ["Service", "Indicator", "Source", "Measurement", "Error budget"]
  const rows = items.map((s) =>
    [s.service, s.indicator, s.source, s.measurement, errorBudgetLabel(s)].map(csvField).join(","),
  )
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
