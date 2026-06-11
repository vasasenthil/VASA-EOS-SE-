// VASA-EOS(SE) — SLA / ageing for workflow cases (government approvals have timelines).
//
// A pending case must not sit silently: this derives how long it has waited in its
// CURRENT state (since the last decision, or since filing) and turns that into an
// on-time / due-soon / overdue badge against a service-level target. Pure + tested;
// the approval inbox renders the badge so overdue cases are visible at a glance.

import type { WorkflowInstance } from "./index"

/** Default service-level target, in days, for one pending tier. */
export const DEFAULT_SLA_DAYS = 7

const DAY_MS = 86_400_000

/** ISO time the case entered its current state: the last action, else when filed. */
export function pendingSince(inst: WorkflowInstance): string | undefined {
  const last = inst.history[inst.history.length - 1]
  return last?.at ?? inst.startedAt
}

/** Whole days the case has waited in its current state; undefined when unknown. */
export function caseAgeDays(inst: WorkflowInstance, now: Date = new Date()): number | undefined {
  const since = pendingSince(inst)
  if (!since) return undefined
  const t = new Date(since).getTime()
  if (Number.isNaN(t)) return undefined
  return Math.max(0, Math.floor((now.getTime() - t) / DAY_MS))
}

export type SlaTone = "ontime" | "due" | "overdue"

export interface SlaBadge {
  days: number
  tone: SlaTone
  label: string
}

/** SLA badge for an OPEN case; null for finished cases or when the age is unknown. */
export function slaBadge(
  inst: WorkflowInstance,
  now: Date = new Date(),
  slaDays: number = DEFAULT_SLA_DAYS,
): SlaBadge | null {
  if (inst.status !== "in_progress") return null
  const days = caseAgeDays(inst, now)
  if (days === undefined) return null
  const tone: SlaTone = days > slaDays ? "overdue" : days >= Math.ceil(slaDays * 0.7) ? "due" : "ontime"
  return { days, tone, label: tone === "overdue" ? `${days}d · overdue` : `${days}d` }
}
