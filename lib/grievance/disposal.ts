// VASA-EOS(SE) — state-tier (Secretariat) grievance disposal workspace.
//
// Most grievances resolve at the school, block or district tier; the ones that escalate to the
// Secretariat land on the Secretary's desk for disposal. This is that desk: the queue of grievances
// at the Secretariat tier, each with an SLA-breach computation (createdAt + slaHours vs now), ordered by
// urgency (breached first, then least time remaining), with disposal aggregates by category. SLA logic is
// time-pure — every function takes an explicit `now` (defaulting to the wall clock) so it is deterministically
// testable. Builds on the grievance core; client-safe.

import { ESCALATION_TIERS, type Grievance } from "@/lib/grievance"

export const SECRETARIAT_TIER = ESCALATION_TIERS.indexOf("Secretariat")

// Illustrative state-tier queue (the persisted queue lives in the server-only store).
export const ESCALATED_GRIEVANCES: Grievance[] = [
  { id: "GRV-1041", category: "Safety / POCSO", description: "Alleged safeguarding lapse pending district action beyond SLA.", tier: SECRETARIAT_TIER, status: "escalated", slaHours: 24, createdAt: "2026-06-05T00:00:00Z" },
  { id: "GRV-1042", category: "Scheme / DBT", description: "Scholarship credit not received across a cluster of schools.", tier: SECRETARIAT_TIER, status: "in_progress", slaHours: 72, createdAt: "2026-06-09T12:00:00Z" },
  { id: "GRV-1043", category: "Fees", description: "Unauthorised fee collection complaint against a private unaided school.", tier: SECRETARIAT_TIER, status: "escalated", slaHours: 48, createdAt: "2026-06-07T00:00:00Z" },
  { id: "GRV-1044", category: "Infrastructure", description: "Toilet block disrepair — resolved after re-appropriation sanction.", tier: SECRETARIAT_TIER, status: "resolved", slaHours: 120, createdAt: "2026-06-01T00:00:00Z" },
  { id: "GRV-1045", category: "Attendance", description: "Teacher absenteeism pattern reported by parents.", tier: SECRETARIAT_TIER, status: "escalated", slaHours: 72, createdAt: "2026-06-08T00:00:00Z" },
  { id: "GRV-1046", category: "Safety / POCSO", description: "Transport-safety complaint — unvetted driver on a school route.", tier: SECRETARIAT_TIER, status: "escalated", slaHours: 24, createdAt: "2026-06-04T00:00:00Z" },
  { id: "GRV-1047", category: "Other", description: "Request for inter-district transfer of a child under RTE.", tier: SECRETARIAT_TIER, status: "in_progress", slaHours: 96, createdAt: "2026-06-09T00:00:00Z" },
]

function dueAt(g: Grievance): number {
  return new Date(g.createdAt).getTime() + g.slaHours * 3600_000
}

/** A grievance is breached if it is undisposed and past its SLA deadline. */
export function isSlaBreached(g: Grievance, now: Date = new Date()): boolean {
  if (g.status === "resolved") return false
  return now.getTime() > dueAt(g)
}

/** Hours remaining to SLA (negative if breached). */
export function slaRemainingHours(g: Grievance, now: Date = new Date()): number {
  return Math.round((dueAt(g) - now.getTime()) / 3600_000)
}

export interface DisposalItem {
  grievance: Grievance
  breached: boolean
  remainingHours: number
}

/** The Secretary's disposal queue: undisposed Secretariat-tier grievances, most urgent first. */
export function disposalQueue(now: Date = new Date(), items: Grievance[] = ESCALATED_GRIEVANCES): DisposalItem[] {
  return items
    .filter((g) => g.tier === SECRETARIAT_TIER && g.status !== "resolved")
    .map((g) => ({ grievance: g, breached: isSlaBreached(g, now), remainingHours: slaRemainingHours(g, now) }))
    .sort((a, b) => a.remainingHours - b.remainingHours)
}

export interface DisposalSummary {
  atSecretariat: number
  pendingDisposal: number
  breached: number
  withinSla: number
  disposed: number
  /** Pending count by category, descending. */
  byCategory: { category: string; count: number }[]
}

export function disposalSummary(now: Date = new Date(), items: Grievance[] = ESCALATED_GRIEVANCES): DisposalSummary {
  const atTier = items.filter((g) => g.tier === SECRETARIAT_TIER)
  const pending = atTier.filter((g) => g.status !== "resolved")
  const breached = pending.filter((g) => isSlaBreached(g, now)).length
  const counts = new Map<string, number>()
  for (const g of pending) counts.set(g.category, (counts.get(g.category) ?? 0) + 1)
  return {
    atSecretariat: atTier.length,
    pendingDisposal: pending.length,
    breached,
    withinSla: pending.length - breached,
    disposed: atTier.filter((g) => g.status === "resolved").length,
    byCategory: [...counts.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count),
  }
}

function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(now: Date = new Date(), items: Grievance[] = ESCALATED_GRIEVANCES): string {
  const header = ["ID", "Category", "Status", "SLA hours", "Remaining hours", "Breached", "Description"]
  const rows = disposalQueue(now, items).map((d) =>
    [d.grievance.id, d.grievance.category, d.grievance.status, String(d.grievance.slaHours), String(d.remainingHours), d.breached ? "yes" : "no", d.grievance.description].map(csvField).join(","),
  )
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
