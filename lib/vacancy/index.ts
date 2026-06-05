// VASA-EOS(SE) — teacher vacancy & rationalisation (sanctioned vs working strength).
// Map posts by subject/cadre and surface vacancy or surplus. Pure logic.

export const CADRES = [
  "Primary (Sec Gr Teacher)",
  "Graduate (BT Assistant)",
  "Post-Graduate (PG Assistant)",
  "Physical Education",
  "Special / inclusive",
  "Headmaster / Headmistress",
]

export interface PostLine {
  id: string
  subject: string
  sanctioned: number
  working: number
}

// Positive = vacancy (short-staffed); negative = surplus (over-staffed).
export function vacancyOf(p: PostLine): number {
  return p.sanctioned - p.working
}

export interface VacancySummary {
  sanctioned: number
  working: number
  vacancies: number
  surplus: number
  fillPct: number
}

export function vacancySummary(lines: PostLine[]): VacancySummary {
  const sanctioned = lines.reduce((sum, l) => sum + l.sanctioned, 0)
  const working = lines.reduce((sum, l) => sum + l.working, 0)
  let vacancies = 0
  let surplus = 0
  for (const l of lines) {
    const gap = vacancyOf(l)
    if (gap > 0) vacancies += gap
    else surplus += -gap
  }
  return {
    sanctioned,
    working,
    vacancies,
    surplus,
    fillPct: sanctioned === 0 ? 0 : Math.round((Math.min(working, sanctioned) / sanctioned) * 100),
  }
}
