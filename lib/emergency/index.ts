// VASA-EOS(SE) — Emergency & Disaster Management (Sec 51 / TNSDMA coordination).
// School-safety readiness, mandated drill compliance, and an incident registry with
// alert levels federated to the Tamil Nadu State Disaster Management Authority.
// Pure logic; production federates to TNSDMA / SACHET alerting behind the seam.

export type AlertLevel = "advisory" | "watch" | "warning" | "emergency"

export type HazardType = "flood" | "cyclone" | "heatwave" | "fire" | "earthquake" | "health"

export interface Incident {
  id: string
  hazard: HazardType
  district: string
  level: AlertLevel
  schoolsAffected: number
  reportedAt: string
  status: "active" | "monitoring" | "closed"
}

export const INCIDENTS: Incident[] = [
  { id: "INC-2401", hazard: "cyclone", district: "Nagapattinam", level: "warning", schoolsAffected: 142, reportedAt: "2026-05-28", status: "active" },
  { id: "INC-2402", hazard: "heatwave", district: "Madurai", level: "watch", schoolsAffected: 318, reportedAt: "2026-06-01", status: "monitoring" },
  { id: "INC-2403", hazard: "flood", district: "Chennai", level: "advisory", schoolsAffected: 56, reportedAt: "2026-06-03", status: "monitoring" },
  { id: "INC-2398", hazard: "fire", district: "Coimbatore", level: "emergency", schoolsAffected: 1, reportedAt: "2026-05-12", status: "closed" },
]

export interface SchoolSafety {
  udise: string
  name: string
  drillsCompleted: number // of mandated 4/year
  hasEvacuationPlan: boolean
  hasFireSafety: boolean
  trainedStaff: number // % of staff first-aid/disaster trained
}

export const SCHOOL_SAFETY: SchoolSafety[] = [
  { udise: "33010100101", name: "GHSS Egmore", drillsCompleted: 4, hasEvacuationPlan: true, hasFireSafety: true, trainedStaff: 85 },
  { udise: "33020200202", name: "GHS Coimbatore Rural", drillsCompleted: 2, hasEvacuationPlan: true, hasFireSafety: false, trainedStaff: 45 },
  { udise: "33030300303", name: "Tribal Welfare School, Nilgiris", drillsCompleted: 1, hasEvacuationPlan: false, hasFireSafety: false, trainedStaff: 20 },
]

export const MANDATED_DRILLS = 4

export interface EmergencySummary {
  activeIncidents: number
  schoolsAffected: number
  highestLevel: AlertLevel
  drillCompliant: number // schools meeting mandated drills
}

const LEVEL_RANK: Record<AlertLevel, number> = { advisory: 1, watch: 2, warning: 3, emergency: 4 }

export function emergencySummary(
  incidents: Incident[] = INCIDENTS,
  safety: SchoolSafety[] = SCHOOL_SAFETY,
): EmergencySummary {
  const active = incidents.filter((i) => i.status !== "closed")
  const highest = active.reduce<AlertLevel>(
    (top, i) => (LEVEL_RANK[i.level] > LEVEL_RANK[top] ? i.level : top),
    "advisory",
  )
  return {
    activeIncidents: active.length,
    schoolsAffected: active.reduce((n, i) => n + i.schoolsAffected, 0),
    highestLevel: highest,
    drillCompliant: safety.filter((s) => s.drillsCompleted >= MANDATED_DRILLS).length,
  }
}

/** Readiness score 0-100 from drills, plans and trained staff. */
export function safetyScore(s: SchoolSafety): number {
  const drill = (Math.min(s.drillsCompleted, MANDATED_DRILLS) / MANDATED_DRILLS) * 40
  const plan = (s.hasEvacuationPlan ? 20 : 0) + (s.hasFireSafety ? 20 : 0)
  const staff = (s.trainedStaff / 100) * 20
  return Math.round(drill + plan + staff)
}
