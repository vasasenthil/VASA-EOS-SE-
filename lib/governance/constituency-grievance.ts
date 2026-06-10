// VASA-EOS(SE) — constituency grievance redress (the Minister's political-accountability view).
//
// A Minister answers to constituencies, not just to the org chart: where are education grievances piling up,
// and where is redress working? This aggregates grievance throughput by Assembly constituency — received,
// resolved and pending — computes a resolution rate, and surfaces the worst-performing constituencies so
// attention follows need. Time-pure aggregation over seeded constituency rows (the live feed is the grievance
// store). Pure + client-safe.

export interface ConstituencyGrievance {
  constituency: string
  district: string
  received: number
  resolved: number
}

export const CONSTITUENCY_GRIEVANCES: ConstituencyGrievance[] = [
  { constituency: "Madurai East", district: "Madurai", received: 140, resolved: 119 },
  { constituency: "Salem West", district: "Salem", received: 96, resolved: 88 },
  { constituency: "Coimbatore South", district: "Coimbatore", received: 120, resolved: 78 },
  { constituency: "Tirunelveli", district: "Tirunelveli", received: 84, resolved: 72 },
  { constituency: "Thanjavur", district: "Thanjavur", received: 110, resolved: 60 },
  { constituency: "Vellore", district: "Vellore", received: 73, resolved: 69 },
  { constituency: "Dindigul", district: "Dindigul", received: 65, resolved: 41 },
  { constituency: "Kanyakumari", district: "Kanyakumari", received: 58, resolved: 55 },
]

export function pending(c: ConstituencyGrievance): number {
  return Math.max(0, c.received - c.resolved)
}

/** Resolution rate as a percentage, 0–100. */
export function resolutionRate(c: ConstituencyGrievance): number {
  return c.received === 0 ? 0 : Math.round((c.resolved / c.received) * 100)
}

/** Constituencies ordered worst-resolution-first (attention follows need). */
export function attentionQueue(items: ConstituencyGrievance[] = CONSTITUENCY_GRIEVANCES): ConstituencyGrievance[] {
  return [...items].sort((a, b) => resolutionRate(a) - resolutionRate(b))
}

export interface ConstituencyGrievanceSummary {
  constituencies: number
  received: number
  resolved: number
  pending: number
  /** Average resolution rate across constituencies, 0–100. */
  avgResolutionRate: number
  /** Constituencies below a 70% resolution-rate threshold. */
  belowThreshold: number
}

export const RESOLUTION_THRESHOLD = 70

export function constituencyGrievanceSummary(items: ConstituencyGrievance[] = CONSTITUENCY_GRIEVANCES): ConstituencyGrievanceSummary {
  const received = items.reduce((s, c) => s + c.received, 0)
  const resolved = items.reduce((s, c) => s + c.resolved, 0)
  const avg = items.length === 0 ? 0 : Math.round(items.reduce((s, c) => s + resolutionRate(c), 0) / items.length)
  return {
    constituencies: items.length,
    received,
    resolved,
    pending: received - resolved,
    avgResolutionRate: avg,
    belowThreshold: items.filter((c) => resolutionRate(c) < RESOLUTION_THRESHOLD).length,
  }
}

function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(items: ConstituencyGrievance[] = CONSTITUENCY_GRIEVANCES): string {
  const header = ["Constituency", "District", "Received", "Resolved", "Pending", "Resolution %"]
  const rows = attentionQueue(items).map((c) =>
    [c.constituency, c.district, String(c.received), String(c.resolved), String(pending(c)), String(resolutionRate(c))].map(csvField).join(","),
  )
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
