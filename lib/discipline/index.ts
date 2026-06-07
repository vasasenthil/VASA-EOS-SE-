// VASA-EOS(SE) — disciplinary / incident log (Sec 48 / safeguarding).
// Record incidents with severity and action; track open vs resolved. Pure summary.

export type Severity = "minor" | "moderate" | "serious"
export type IncidentStatus = "open" | "resolved"

export const INCIDENT_TYPES = ["Absenteeism", "Bullying", "Property damage", "Misconduct", "Safety", "Other"]

export interface Incident {
  id: string
  student: string
  type: string
  severity: Severity
  action: string
  date: string
  status: IncidentStatus
  /** Tenant node this incident belongs to — drives per-role data scoping. */
  tenantId: string
}

export interface DisciplineSummary {
  total: number
  open: number
  resolved: number
  serious: number
}

export function disciplineSummary(incidents: Incident[]): DisciplineSummary {
  return {
    total: incidents.length,
    open: incidents.filter((i) => i.status === "open").length,
    resolved: incidents.filter((i) => i.status === "resolved").length,
    serious: incidents.filter((i) => i.severity === "serious").length,
  }
}
