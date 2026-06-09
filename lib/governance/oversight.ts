// VASA-EOS(SE) — Governance Oversight aggregation.
//
// A pure, testable rollup over LIVE workflow instances drawn from every approval
// flow (leave · SMC · recognition · admission · grievance · maintenance). It powers
// the real-time Governance Command Centre: how many items are in flight, who they are
// waiting on, how they split by process, and how long they have been pending — the
// cross-cutting oversight a Secretary/Minister needs that no single inbox provides.
//
// It operates on plain OversightItem[] (no engine/store import) so it is fully pure;
// the page projects each flow's records into this shape using the workflow engine.

import type { InstanceStatus } from "@/lib/workflow"

export interface OversightItem {
  /** Workflow definition id (e.g. "leave-approval"). */
  flowId: string
  /** Human flow label (e.g. "Teacher Leave Approval"). */
  flowLabel: string
  recordId: string
  title: string
  status: InstanceStatus
  /** Approver role awaiting action, or null when the instance is finished. */
  currentRole: string | null
  currentStepName: string | null
  /** Completion percentage from the engine. */
  pct: number
  /** ISO timestamp of the last action (or the filing), "" when unknown. */
  updatedAt: string
}

export interface OversightSummary {
  total: number
  inProgress: number
  approved: number
  rejected: number
  /** Active instances as a share of the total (0–100, rounded). */
  activePct: number
}

export function summarizeOversight(items: OversightItem[]): OversightSummary {
  const inProgress = items.filter((i) => i.status === "in_progress").length
  const approved = items.filter((i) => i.status === "approved").length
  const rejected = items.filter((i) => i.status === "rejected").length
  const total = items.length
  return {
    total,
    inProgress,
    approved,
    rejected,
    activePct: total === 0 ? 0 : Math.round((inProgress / total) * 100),
  }
}

export interface FlowRollup {
  flowId: string
  flowLabel: string
  total: number
  inProgress: number
  approved: number
  rejected: number
}

/** Per-process rollup, ordered by most in-flight first then by total. */
export function rollupByFlow(items: OversightItem[]): FlowRollup[] {
  const map = new Map<string, FlowRollup>()
  for (const i of items) {
    const r =
      map.get(i.flowId) ??
      { flowId: i.flowId, flowLabel: i.flowLabel, total: 0, inProgress: 0, approved: 0, rejected: 0 }
    r.total += 1
    if (i.status === "in_progress") r.inProgress += 1
    else if (i.status === "approved") r.approved += 1
    else r.rejected += 1
    map.set(i.flowId, r)
  }
  return [...map.values()].sort((a, b) => b.inProgress - a.inProgress || b.total - a.total)
}

export interface RolePending {
  role: string
  count: number
}

/** Pending approvals grouped by the role that must act next (in-progress only). */
export function pendingByRole(items: OversightItem[]): RolePending[] {
  const map = new Map<string, number>()
  for (const i of items) {
    if (i.status !== "in_progress" || !i.currentRole) continue
    map.set(i.currentRole, (map.get(i.currentRole) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count || a.role.localeCompare(b.role))
}

export type AgeBucket = "≤1 day" | "1–3 days" | "3–7 days" | ">7 days" | "unknown"

export const AGE_BUCKETS: AgeBucket[] = ["≤1 day", "1–3 days", "3–7 days", ">7 days", "unknown"]

export function ageBucketFor(updatedAt: string, now: number): AgeBucket {
  if (!updatedAt) return "unknown"
  const t = Date.parse(updatedAt)
  if (Number.isNaN(t)) return "unknown"
  const days = (now - t) / 86_400_000
  if (days <= 1) return "≤1 day"
  if (days <= 3) return "1–3 days"
  if (days <= 7) return "3–7 days"
  return ">7 days"
}

export interface AgingRow {
  bucket: AgeBucket
  count: number
}

/** Aging profile of the IN-PROGRESS backlog — the SLA-risk view. */
export function agingProfile(items: OversightItem[], now: number = Date.now()): AgingRow[] {
  const counts = new Map<AgeBucket, number>(AGE_BUCKETS.map((b) => [b, 0]))
  for (const i of items) {
    if (i.status !== "in_progress") continue
    const b = ageBucketFor(i.updatedAt, now)
    counts.set(b, (counts.get(b) ?? 0) + 1)
  }
  return AGE_BUCKETS.map((bucket) => ({ bucket, count: counts.get(bucket) ?? 0 }))
}

function csvField(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/** RFC 4180 CSV report of every tracked item — the downloadable oversight register. */
export function oversightToCSV(items: OversightItem[]): string {
  const header = ["Process", "Record", "Title", "Status", "Awaiting role", "Current step", "Percent", "Updated"]
  const rows = items.map((i) =>
    [i.flowLabel, i.recordId, i.title, i.status, i.currentRole ?? "", i.currentStepName ?? "", String(i.pct), i.updatedAt]
      .map(csvField)
      .join(","),
  )
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
