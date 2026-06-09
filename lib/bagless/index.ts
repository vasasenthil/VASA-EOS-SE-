// VASA-EOS(SE) — bagless days & experiential learning (NEP 2020, 10 bagless days/year).
// Log experiential activities and track progress toward the annual target. Pure logic.

export const BAGLESS_TARGET = 10

export const BAGLESS_TYPES = [
  "Local craft / artisan",
  "Field / nature visit",
  "Kitchen gardening",
  "Carpentry / metalwork",
  "Art & music",
  "Community service",
  "Local enterprise visit",
]

export interface BaglessActivity {
  id: string
  title: string
  type: string
  date: string
  classGroup: string
  participants: number
  /** Tenant node this activity belongs to — drives per-role data scoping. */
  tenantId: string
}

export interface BaglessSummary {
  activities: number
  daysLogged: number
  participants: number
  targetPct: number
}

export function baglessSummary(activities: BaglessActivity[]): BaglessSummary {
  const daysLogged = new Set(activities.map((a) => a.date)).size
  return {
    activities: activities.length,
    daysLogged,
    participants: activities.reduce((sum, a) => sum + a.participants, 0),
    targetPct: Math.min(100, Math.round((daysLogged / BAGLESS_TARGET) * 100)),
  }
}
