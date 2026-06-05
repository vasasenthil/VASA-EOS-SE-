// VASA-EOS(SE) — mid-day-meal / CMBS daily register (Flagship 02 / PM POSHAN).
// Daily enrolment vs present vs meals served, with consumption rate and a leakage
// flag (more meals claimed than children present). Pure logic.

export interface MdmEntry {
  id: string
  date: string
  enrolment: number
  present: number
  mealsServed: number
  menu: string
}

/** Meals served as a percentage of children present. */
export function consumptionPct(present: number, mealsServed: number): number {
  return present <= 0 ? 0 : Math.round((mealsServed / present) * 100)
}

/** Leakage when more meals are claimed than children present. */
export function leakageFlag(present: number, mealsServed: number): boolean {
  return mealsServed > present
}

export interface MdmSummary {
  days: number
  totalMeals: number
  avgConsumptionPct: number
  leakageDays: number
}

export function mdmSummary(entries: MdmEntry[]): MdmSummary {
  if (entries.length === 0) return { days: 0, totalMeals: 0, avgConsumptionPct: 0, leakageDays: 0 }
  const totalMeals = entries.reduce((s, e) => s + e.mealsServed, 0)
  const avg = entries.reduce((s, e) => s + consumptionPct(e.present, e.mealsServed), 0) / entries.length
  return {
    days: entries.length,
    totalMeals,
    avgConsumptionPct: Math.round(avg),
    leakageDays: entries.filter((e) => leakageFlag(e.present, e.mealsServed)).length,
  }
}
