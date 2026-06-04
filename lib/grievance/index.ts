// VASA-EOS(SE) — Grievance Redressal (Sec 48).
// Multi-tier escalation with SLA, CPGRAMS federation. Every action is audit-logged.
// In-memory mock store for demo; production persists.

import { appendAudit } from "@/lib/audit/trail"

export type GrievanceStatus = "open" | "in_progress" | "escalated" | "resolved"

export const ESCALATION_TIERS = ["Class Teacher", "Principal", "BEO", "DEO", "Secretariat"]

export const GRIEVANCE_CATEGORIES = ["Scheme / DBT", "Fees", "Attendance", "Infrastructure", "Safety / POCSO", "Other"]

export interface Grievance {
  id: string
  category: string
  description: string
  tier: number // index into ESCALATION_TIERS
  status: GrievanceStatus
  slaHours: number
  createdAt: string
}

function id(): string {
  return `GRV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

const store: Grievance[] = [
  { id: "GRV-SEED01", category: "Scheme / DBT", description: "Pudhumai Penn payment not received", tier: 1, status: "in_progress", slaHours: 72, createdAt: new Date().toISOString() },
]

export function fileGrievance(input: { category: string; description: string }): Grievance {
  const g: Grievance = {
    id: id(),
    category: input.category,
    description: input.description,
    tier: 0,
    status: "open",
    slaHours: 72,
    createdAt: new Date().toISOString(),
  }
  store.unshift(g)
  appendAudit({ actor: "citizen", action: "grievance.file", resource: g.id, details: { category: g.category } })
  return g
}

export function escalateGrievance(gid: string): Grievance | undefined {
  const g = store.find((x) => x.id === gid)
  if (!g) return undefined
  if (g.tier < ESCALATION_TIERS.length - 1) g.tier += 1
  g.status = "escalated"
  appendAudit({ actor: "system", action: "grievance.escalate", resource: gid, details: { tier: ESCALATION_TIERS[g.tier] } })
  return g
}

export function resolveGrievance(gid: string): Grievance | undefined {
  const g = store.find((x) => x.id === gid)
  if (!g) return undefined
  g.status = "resolved"
  appendAudit({ actor: ESCALATION_TIERS[g.tier], action: "grievance.resolve", resource: gid })
  return g
}

export function listGrievances(): Grievance[] {
  return [...store]
}
