// VASA-EOS(SE) — operational efficiency register (Operations / governance excellence).
//
// The recommendation quantifies the governance time-and-money savings the platform
// delivers — student transfers, examination processing, teacher transfers, scheme
// disbursement, grievance redressal and teacher administrative burden. This makes those
// claims inspectable: each process mapped to the manual baseline, the platform target,
// the improvement, and the in-repo module that owns it (asserted to exist on disk —
// self-verifying). Improvements are illustrative targets; processes whose speed-up needs
// a live provider/LLM at deploy are honestly 'partial'. Pure + client-safe.

import { csvField } from "@/lib/csv"

export type ProcessStatus = "implemented" | "partial"

export interface ProcessEfficiency {
  id: string
  process: string
  /** Manual baseline today. */
  before: string
  /** Platform target. */
  after: string
  /** Illustrative improvement (% faster, or % transparency). */
  improvementPct: number
  /** Module that owns the process (asserted to exist on disk). */
  controlRef: string
  status: ProcessStatus
}

export const PROCESS_EFFICIENCIES: ProcessEfficiency[] = [
  { id: "student-transfer", process: "Student transfer (TC)", before: "2–4 weeks running between offices", after: "24–72 hours, APAAR-portable", improvementPct: 95, controlRef: "lib/tc", status: "implemented" },
  { id: "exam-processing", process: "Examination processing", before: "Manual tabulation, malpractice-prone", after: "AI-augmented + malpractice detection", improvementPct: 90, controlRef: "lib/exams/integrity.ts", status: "implemented" },
  { id: "teacher-transfer", process: "Teacher transfer", before: "Opaque, influence-prone", after: "100% transparent, every decision recorded", improvementPct: 100, controlRef: "lib/staff/transfer.ts", status: "implemented" },
  { id: "scheme-disbursement", process: "Scheme disbursement", before: "Months of paperwork", after: "Days, automated DBT-APBS", improvementPct: 85, controlRef: "lib/integrations/live/dbt.ts", status: "partial" },
  { id: "grievance-redressal", process: "Grievance redressal", before: "Weeks of uncertainty", after: "SLA-based with escalation & tracking", improvementPct: 90, controlRef: "lib/grievance", status: "implemented" },
  { id: "teacher-admin-burden", process: "Teacher administrative burden", before: "Hours of registers & paperwork", after: "AI assistant handles routine admin", improvementPct: 60, controlRef: "lib/agents/teacher-assistant.ts", status: "partial" },
]

export function processById(id: string): ProcessEfficiency | undefined {
  return PROCESS_EFFICIENCIES.find((p) => p.id === id)
}

export function byStatus(status: ProcessStatus): ProcessEfficiency[] {
  return PROCESS_EFFICIENCIES.filter((p) => p.status === status)
}

export interface EfficiencySummary {
  processes: number
  implemented: number
  partial: number
  /** Mean illustrative improvement across processes (rounded). */
  avgImprovementPct: number
}

export function efficiencySummary(items: ProcessEfficiency[] = PROCESS_EFFICIENCIES): EfficiencySummary {
  const avg = items.length ? Math.round(items.reduce((n, p) => n + p.improvementPct, 0) / items.length) : 0
  return {
    processes: items.length,
    implemented: items.filter((p) => p.status === "implemented").length,
    partial: items.filter((p) => p.status === "partial").length,
    avgImprovementPct: avg,
  }
}

export function toCSV(items: ProcessEfficiency[] = PROCESS_EFFICIENCIES): string {
  const header = ["Process", "Before", "After", "Improvement %", "Component", "Status"]
  const rows = items.map((p) =>
    [p.process, p.before, p.after, String(p.improvementPct), p.controlRef, p.status].map(csvField).join(","),
  )
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
