// VASA-EOS(SE) — fire & mock-drill log (disaster preparedness / NDMA school safety).
// Record evacuation drills and track against a target evacuation time. Pure logic.

export const DRILL_TYPES = [
  "Fire",
  "Earthquake",
  "Flood",
  "Lockdown / security",
  "First-aid / medical",
]

// NDMA guidance: a school building should evacuate within ~4 minutes.
export const DRILL_TARGET_SEC = 240

export interface Drill {
  id: string
  type: string
  date: string
  evacTimeSec: number
  participants: number
  observations: string
  /** Tenant node this drill belongs to — drives per-role data scoping. */
  tenantId: string
}

export function isWithinTarget(d: Drill): boolean {
  return d.evacTimeSec > 0 && d.evacTimeSec <= DRILL_TARGET_SEC
}

export interface DrillSummary {
  total: number
  participants: number
  avgEvacSec: number
  withinTarget: number
}

export function drillSummary(drills: Drill[]): DrillSummary {
  const timed = drills.filter((d) => d.evacTimeSec > 0)
  const avg = timed.length === 0 ? 0 : Math.round(timed.reduce((sum, d) => sum + d.evacTimeSec, 0) / timed.length)
  return {
    total: drills.length,
    participants: drills.reduce((sum, d) => sum + d.participants, 0),
    avgEvacSec: avg,
    withinTarget: drills.filter(isWithinTarget).length,
  }
}
