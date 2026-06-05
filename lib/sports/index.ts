// VASA-EOS(SE) — sports / athletics meet (Sec 50 / Khelo India).
// Record event results and a medal tally with points. Pure helpers.

export const SPORT_EVENTS = ["100m Sprint", "Long Jump", "Kabaddi", "Volleyball", "Chess", "Athletics Relay"]

export type Medal = "gold" | "silver" | "bronze" | "participation"

export const MEDAL_POINTS: Record<Medal, number> = { gold: 5, silver: 3, bronze: 1, participation: 0 }

export interface SportResult {
  id: string
  event: string
  student: string
  medal: Medal
}

export interface SportsSummary {
  results: number
  events: number
  gold: number
  silver: number
  bronze: number
  points: number
}

export function sportsSummary(results: SportResult[]): SportsSummary {
  return {
    results: results.length,
    events: new Set(results.map((r) => r.event)).size,
    gold: results.filter((r) => r.medal === "gold").length,
    silver: results.filter((r) => r.medal === "silver").length,
    bronze: results.filter((r) => r.medal === "bronze").length,
    points: results.reduce((s, r) => s + MEDAL_POINTS[r.medal], 0),
  }
}
