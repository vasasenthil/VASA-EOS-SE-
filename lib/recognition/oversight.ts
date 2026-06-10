// VASA-EOS(SE) — state-tier school-recognition oversight (TN Recognised Private Schools Act 1973).
//
// Recognition under the TN 1973 Act is time-bound: an application that sits undecided past the statutory
// window is itself a default by the State. The DEO decides; the Secretary oversees the pipeline and the
// clock. This is that oversight — every recognition application in flight, with days-elapsed against the
// statutory decision window, an eligibility-completeness score, a queue ordered overdue-first, and rollups
// by stage and district. The clock is time-pure (every function takes an explicit `now`) so it is
// deterministically testable. Builds on the recognition core; client-safe.

import { ELIGIBILITY_CRITERIA, RECOGNITION_STAGES, type RecognitionApplication } from "@/lib/recognition"

/** Statutory window (days) to decide a recognition application before it is in default. */
export const STATUTORY_DECISION_DAYS = 90

export interface OversightApplication extends RecognitionApplication {
  /** Date the application was received (starts the statutory clock). */
  receivedAt: string
}

// Illustrative pipeline (the persisted applications live in the server-only store).
export const RECOGNITION_PIPELINE: OversightApplication[] = [
  { id: "REC-2041", school: "Bharathi Matriculation School", district: "Madurai", type: "new", stageIndex: 3, status: "in_progress", criteriaMet: ["Trust/Society registration", "Land & building ownership/lease", "RTE infrastructure norms", "Qualified teachers (TET)", "Sanitation & drinking water"], updatedAt: "2026-05-20T00:00:00Z", receivedAt: "2026-01-15T00:00:00Z" },
  { id: "REC-2042", school: "Green Valley Renewal School", district: "Coimbatore", type: "renewal", stageIndex: 2, status: "in_progress", criteriaMet: ["Trust/Society registration", "Land & building ownership/lease", "RTE infrastructure norms", "Sanitation & drinking water"], updatedAt: "2026-06-01T00:00:00Z", receivedAt: "2026-05-01T00:00:00Z" },
  { id: "REC-2043", school: "St. Anne's New School", district: "Tiruchirappalli", type: "new", stageIndex: 1, status: "in_progress", criteriaMet: ["Trust/Society registration", "Land & building ownership/lease", "RTE infrastructure norms"], updatedAt: "2026-04-10T00:00:00Z", receivedAt: "2025-12-01T00:00:00Z" },
  { id: "REC-2044", school: "Kalvi Public School", district: "Salem", type: "new", stageIndex: 4, status: "recognised", criteriaMet: [...ELIGIBILITY_CRITERIA], updatedAt: "2026-05-15T00:00:00Z", receivedAt: "2026-03-01T00:00:00Z" },
  { id: "REC-2045", school: "Crescent Renewal School", district: "Chennai", type: "renewal", stageIndex: 3, status: "in_progress", criteriaMet: [...ELIGIBILITY_CRITERIA], updatedAt: "2026-06-05T00:00:00Z", receivedAt: "2026-04-20T00:00:00Z" },
  { id: "REC-2046", school: "Hilltop Academy", district: "Nilgiris", type: "new", stageIndex: 1, status: "rejected", criteriaMet: ["Trust/Society registration", "Land & building ownership/lease"], updatedAt: "2026-04-01T00:00:00Z", receivedAt: "2026-02-10T00:00:00Z" },
  { id: "REC-2047", school: "Sunrise New School", district: "Erode", type: "new", stageIndex: 0, status: "in_progress", criteriaMet: ["Trust/Society registration"], updatedAt: "2026-05-26T00:00:00Z", receivedAt: "2026-05-25T00:00:00Z" },
]

export function daysElapsed(app: OversightApplication, now: Date = new Date()): number {
  return Math.floor((now.getTime() - new Date(app.receivedAt).getTime()) / 86_400_000)
}

/** Overdue = still in progress and past the statutory decision window. */
export function isOverdue(app: OversightApplication, now: Date = new Date()): boolean {
  return app.status === "in_progress" && daysElapsed(app, now) > STATUTORY_DECISION_DAYS
}

/** Eligibility completeness as a percentage of statutory criteria met. */
export function completenessPct(app: OversightApplication): number {
  return Math.round((app.criteriaMet.length / ELIGIBILITY_CRITERIA.length) * 100)
}

export interface OversightItem {
  application: OversightApplication
  elapsed: number
  overdue: boolean
  completeness: number
  stage: string
}

/** In-flight applications, overdue first then longest-pending. */
export function oversightQueue(now: Date = new Date(), items: OversightApplication[] = RECOGNITION_PIPELINE): OversightItem[] {
  return items
    .filter((a) => a.status === "in_progress")
    .map((a) => ({ application: a, elapsed: daysElapsed(a, now), overdue: isOverdue(a, now), completeness: completenessPct(a), stage: RECOGNITION_STAGES[a.stageIndex] }))
    .sort((a, b) => b.elapsed - a.elapsed)
}

export interface OversightSummary {
  total: number
  inProgress: number
  recognised: number
  rejected: number
  overdue: number
  /** Average eligibility completeness across in-flight applications. */
  avgCompletenessPct: number
  byStage: { stage: string; count: number }[]
}

export function oversightSummary(now: Date = new Date(), items: OversightApplication[] = RECOGNITION_PIPELINE): OversightSummary {
  const inFlight = items.filter((a) => a.status === "in_progress")
  const counts = new Map<string, number>()
  for (const a of inFlight) {
    const stage = RECOGNITION_STAGES[a.stageIndex]
    counts.set(stage, (counts.get(stage) ?? 0) + 1)
  }
  const avg = inFlight.length === 0 ? 0 : Math.round(inFlight.reduce((s, a) => s + completenessPct(a), 0) / inFlight.length)
  return {
    total: items.length,
    inProgress: inFlight.length,
    recognised: items.filter((a) => a.status === "recognised").length,
    rejected: items.filter((a) => a.status === "rejected").length,
    overdue: inFlight.filter((a) => isOverdue(a, now)).length,
    avgCompletenessPct: avg,
    byStage: [...counts.entries()].map(([stage, count]) => ({ stage, count })).sort((a, b) => b.count - a.count),
  }
}

function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(now: Date = new Date(), items: OversightApplication[] = RECOGNITION_PIPELINE): string {
  const header = ["ID", "School", "District", "Type", "Stage", "Elapsed days", "Overdue", "Completeness %"]
  const rows = oversightQueue(now, items).map((o) =>
    [o.application.id, o.application.school, o.application.district, o.application.type, o.stage, String(o.elapsed), o.overdue ? "yes" : "no", String(o.completeness)].map(csvField).join(","),
  )
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
