// VASA-EOS(SE) — PARAKH competency assessment (Module Catalogue v3.0 — National/Assessment tier).
//
// PARAKH (the national assessment body under NCERT) runs competency-based holistic assessment — the National
// Achievement Survey banding every learner into a proficiency level (Below Basic / Basic / Proficient /
// Advanced) per subject and grade, not a single mark. This models a cohort's PARAKH result: the level
// distribution per subject, the proficiency rate (Proficient + Advanced), and the weakest area so remediation
// is targeted. Sample cohort seeded; real survey data ingests via the data pipeline. Pure + client-safe.

import { csvField } from "@/lib/csv"

export const PROFICIENCY_LEVELS = ["Below Basic", "Basic", "Proficient", "Advanced"] as const

export interface SubjectResult {
  subject: string
  grade: number
  /** Student counts per PROFICIENCY_LEVELS entry (4 values). */
  distribution: number[]
}

export const PARAKH_RESULTS: SubjectResult[] = [
  { subject: "Language", grade: 3, distribution: [40, 100, 160, 100] },
  { subject: "Mathematics", grade: 3, distribution: [80, 140, 120, 60] },
  { subject: "EVS", grade: 3, distribution: [48, 120, 152, 80] },
  { subject: "Language", grade: 5, distribution: [60, 120, 140, 80] },
  { subject: "Mathematics", grade: 5, distribution: [100, 140, 100, 60] },
  { subject: "Mathematics", grade: 8, distribution: [120, 140, 100, 40] },
]

export function assessed(r: SubjectResult): number {
  return r.distribution.reduce((a, b) => a + b, 0)
}

/** Proficiency rate: the share at Proficient or Advanced, 0–100. */
export function proficientPct(r: SubjectResult): number {
  const total = assessed(r)
  return total === 0 ? 0 : Math.round(((r.distribution[2] + r.distribution[3]) / total) * 100)
}

/** Share at Below Basic — the remediation priority, 0–100. */
export function belowBasicPct(r: SubjectResult): number {
  const total = assessed(r)
  return total === 0 ? 0 : Math.round((r.distribution[0] / total) * 100)
}

export interface ParakhSummary {
  results: number
  totalAssessed: number
  /** Average proficiency rate across subjects, 0–100. */
  avgProficiencyPct: number
  weakest: string
  strongest: string
}

export function parakhSummary(items: SubjectResult[] = PARAKH_RESULTS): ParakhSummary {
  if (items.length === 0) {
    return { results: 0, totalAssessed: 0, avgProficiencyPct: 0, weakest: "", strongest: "" }
  }
  const ranked = [...items].sort((a, b) => proficientPct(a) - proficientPct(b))
  const label = (r: SubjectResult) => `${r.subject} (Grade ${r.grade})`
  return {
    results: items.length,
    totalAssessed: items.reduce((s, r) => s + assessed(r), 0),
    avgProficiencyPct: Math.round(items.reduce((s, r) => s + proficientPct(r), 0) / items.length),
    weakest: label(ranked[0]),
    strongest: label(ranked[ranked.length - 1]),
  }
}


export function toCSV(items: SubjectResult[] = PARAKH_RESULTS): string {
  const header = ["Subject", "Grade", "Assessed", "Below Basic %", "Proficiency %"]
  const rows = items.map((r) => [r.subject, String(r.grade), String(assessed(r)), String(belowBasicPct(r)), String(proficientPct(r))].map(csvField).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
