// VASA-EOS(SE) — NSS / NCC / Scouts & Guides cadet register (youth service wings).
// Enrol cadets into a wing and log community-service hours. Pure logic.

export const YOUTH_WINGS = [
  "NSS",
  "NCC (Army wing)",
  "NCC (Naval wing)",
  "NCC (Air wing)",
  "Scouts & Guides",
  "Junior Red Cross",
]

export interface Cadet {
  id: string
  name: string
  cls: string
  wing: string
  serviceHours: number
}

export interface YouthSummary {
  cadets: number
  wings: number
  totalHours: number
  avgHours: number
}

export function youthSummary(cadets: Cadet[]): YouthSummary {
  const n = cadets.length
  const totalHours = cadets.reduce((sum, c) => sum + c.serviceHours, 0)
  return {
    cadets: n,
    wings: new Set(cadets.map((c) => c.wing)).size,
    totalHours,
    avgHours: n === 0 ? 0 : Math.round(totalHours / n),
  }
}
