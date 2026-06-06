// VASA-EOS(SE) — morning assembly / Bal Sabha log (value education, student voice).
// Record who conducted assembly, the theme and thought for the day. Pure logic.

export const ASSEMBLY_THEMES = [
  "Patriotism",
  "Moral values",
  "Health & hygiene",
  "Environment",
  "Science & curiosity",
  "Cultural diversity",
  "Gratitude & kindness",
]

export interface Assembly {
  id: string
  date: string
  cls: string
  theme: string
  conductedBy: string
  thought: string
}

export interface AssemblySummary {
  total: number
  classes: number
  themes: number
  days: number
}

export function assemblySummary(items: Assembly[]): AssemblySummary {
  return {
    total: items.length,
    classes: new Set(items.map((a) => a.cls)).size,
    themes: new Set(items.map((a) => a.theme)).size,
    days: new Set(items.map((a) => a.date)).size,
  }
}
