// VASA-EOS(SE) — eco club & tree plantation log (green school / environmental literacy).
// Log green activities, count saplings planted and survival. Pure logic.

export const ECO_ACTIVITIES = [
  "Tree plantation",
  "Waste segregation drive",
  "Kitchen / herbal garden",
  "Water conservation",
  "Plastic-free campaign",
  "Nature walk / bird count",
]

export interface EcoActivity {
  id: string
  title: string
  type: string
  saplings: number
  survived: number
  date: string
  /** Tenant node this activity belongs to — drives per-role data scoping. */
  tenantId: string
}

export interface EcoSummary {
  activities: number
  saplingsPlanted: number
  saplingsSurvived: number
  survivalPct: number
}

export function ecoSummary(activities: EcoActivity[]): EcoSummary {
  const planted = activities.reduce((sum, a) => sum + a.saplings, 0)
  const survived = activities.reduce((sum, a) => sum + Math.min(a.survived, a.saplings), 0)
  return {
    activities: activities.length,
    saplingsPlanted: planted,
    saplingsSurvived: survived,
    survivalPct: planted === 0 ? 0 : Math.round((survived / planted) * 100),
  }
}
