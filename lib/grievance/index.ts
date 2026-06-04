// VASA-EOS(SE) — Grievance Redressal (Sec 48) — client-safe core.
// Multi-tier escalation with SLA and CPGRAMS federation. Constants and types live
// here; DB-backed persistence (audit-logged) lives in ./store (server-only).

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
