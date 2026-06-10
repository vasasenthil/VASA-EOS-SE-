// VASA-EOS(SE) — adolescent mental-health & wellbeing screening (Module Catalogue v3.0 — School tier).
//
// NEP 2020 and RBSK recognise adolescent mental health as core to school health. This models a brief wellbeing
// screen across six concern domains (stress, anxiety, mood, sleep, peer relationships, exam pressure), each
// rated 0–4 (higher = more concern). A total score places each student in a band — well / monitor / refer — and
// 'refer' routes to the counsellor / RBSK mental-health pathway. Screening is confidential and consent-gated in
// practice; this layer is the pure scoring logic. Sample cohort seeded; real screens persist behind getDb().
// Pure + client-safe.

export const WELLBEING_DOMAINS = [
  "Stress",
  "Anxiety",
  "Mood",
  "Sleep",
  "Peer relationships",
  "Exam pressure",
] as const

export type WellbeingBand = "well" | "monitor" | "refer"

export interface Screening {
  studentId: string
  name: string
  grade: number
  /** One 0–4 score per WELLBEING_DOMAINS entry (higher = more concern). */
  scores: number[]
}

export const SCREENINGS: Screening[] = [
  { studentId: "S-9001", name: "Student A", grade: 9, scores: [1, 0, 1, 1, 0, 1] },
  { studentId: "S-9002", name: "Student B", grade: 10, scores: [3, 3, 2, 2, 1, 4] },
  { studentId: "S-9003", name: "Student C", grade: 11, scores: [2, 1, 2, 1, 2, 2] },
  { studentId: "S-9004", name: "Student D", grade: 12, scores: [4, 4, 3, 3, 2, 4] },
  { studentId: "S-9005", name: "Student E", grade: 9, scores: [0, 1, 0, 0, 1, 0] },
  { studentId: "S-9006", name: "Student F", grade: 10, scores: [2, 2, 1, 2, 1, 3] },
  { studentId: "S-9007", name: "Student G", grade: 12, scores: [3, 2, 3, 2, 1, 4] },
  { studentId: "S-9008", name: "Student H", grade: 11, scores: [1, 1, 1, 0, 1, 1] },
]

export const MAX_PER_DOMAIN = 4

export function totalScore(s: Screening): number {
  return s.scores.reduce((a, b) => a + b, 0)
}

/** Banding thresholds over a 0–24 total. */
export function band(s: Screening): WellbeingBand {
  const t = totalScore(s)
  if (t <= 6) return "well"
  if (t <= 12) return "monitor"
  return "refer"
}

/** The domain with the highest concern score for a student. */
export function topConcern(s: Screening): string {
  let max = -1
  let idx = 0
  s.scores.forEach((v, i) => {
    if (v > max) {
      max = v
      idx = i
    }
  })
  return WELLBEING_DOMAINS[idx]
}

/** Students whose band is 'refer' — the referral list, highest score first. */
export function referrals(items: Screening[] = SCREENINGS): Screening[] {
  return items.filter((s) => band(s) === "refer").sort((a, b) => totalScore(b) - totalScore(a))
}

export interface MentalHealthSummary {
  screened: number
  well: number
  monitor: number
  refer: number
  /** Average total score across the cohort (one decimal). */
  avgScore: number
  /** The cohort's most-flagged concern domain. */
  topCohortConcern: string
}

export function mentalHealthSummary(items: Screening[] = SCREENINGS): MentalHealthSummary {
  const domainTotals = WELLBEING_DOMAINS.map((_, i) => items.reduce((s, x) => s + x.scores[i], 0))
  let maxDomain = 0
  domainTotals.forEach((v, i) => {
    if (v > domainTotals[maxDomain]) maxDomain = i
  })
  const avg = items.length === 0 ? 0 : Math.round((items.reduce((s, x) => s + totalScore(x), 0) / items.length) * 10) / 10
  return {
    screened: items.length,
    well: items.filter((s) => band(s) === "well").length,
    monitor: items.filter((s) => band(s) === "monitor").length,
    refer: items.filter((s) => band(s) === "refer").length,
    avgScore: avg,
    topCohortConcern: WELLBEING_DOMAINS[maxDomain],
  }
}

function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(items: Screening[] = SCREENINGS): string {
  const header = ["Student", "Grade", "Total", "Band", "Top concern"]
  const rows = items.map((s) => [s.studentId, String(s.grade), String(totalScore(s)), band(s), topConcern(s)].map(csvField).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
