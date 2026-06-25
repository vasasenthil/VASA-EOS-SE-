// VASA-EOS(SE) — NPST competency tracking (National Professional Standards for Teachers).
//
// NEP 2020 mandates the NPST: every teacher progresses through career stages (Proficient → Expert → Lead)
// against competency standards, not by seniority alone. This models a teacher's competency profile across the
// core NPST domains — current level vs the level expected at their target stage — computes the gaps, the overall
// competency, and whether they are ready to progress. The CPD plan flows from the gaps. Sample profile seeded;
// a real assessment would persist behind the getDb() seam. Pure + client-safe.

import { csvField } from "@/lib/csv"

export const CAREER_STAGES = ["Proficient", "Proficient-II", "Expert", "Lead"] as const
export type CareerStage = (typeof CAREER_STAGES)[number]

export interface NpstDomain {
  key: string
  name: string
  /** Observed competency (1–5). */
  current: number
  /** Level expected at the target stage (1–5). */
  expected: number
}

/** A teacher's NPST profile against a target career stage. */
export interface NpstProfile {
  teacherId: string
  name: string
  targetStage: CareerStage
  domains: NpstDomain[]
}

export const SAMPLE_PROFILE: NpstProfile = {
  teacherId: "TR33010045",
  name: "Lakshmi Narayanan",
  targetStage: "Expert",
  domains: [
    { key: "knowledge", name: "Knowledge & subject understanding", current: 4, expected: 4 },
    { key: "pedagogy", name: "Pedagogy & classroom practice", current: 3, expected: 4 },
    { key: "assessment", name: "Assessment & feedback", current: 3, expected: 4 },
    { key: "inclusion", name: "Inclusion & equity", current: 4, expected: 4 },
    { key: "ethics", name: "Professional ethics & conduct", current: 5, expected: 4 },
    { key: "ict", name: "ICT & innovation in teaching", current: 2, expected: 3 },
  ],
}

export function gap(d: NpstDomain): number {
  return Math.max(0, d.expected - d.current)
}

/** Domains where the teacher is below the expected level — the CPD agenda. */
export function developmentAreas(profile: NpstProfile = SAMPLE_PROFILE): NpstDomain[] {
  return profile.domains.filter((d) => d.current < d.expected).sort((a, b) => gap(b) - gap(a))
}

/** Overall competency as a percentage of the maximum (5 per domain). */
export function competencyPct(profile: NpstProfile = SAMPLE_PROFILE): number {
  if (profile.domains.length === 0) return 0
  const total = profile.domains.reduce((s, d) => s + d.current, 0)
  return Math.round((total / (profile.domains.length * 5)) * 100)
}

/** Ready to progress only when every domain meets its expected level. */
export function readyToProgress(profile: NpstProfile = SAMPLE_PROFILE): boolean {
  return profile.domains.every((d) => d.current >= d.expected)
}

export interface NpstSummary {
  domains: number
  competencyPct: number
  developmentAreas: number
  atOrAboveExpected: number
  readyToProgress: boolean
  targetStage: CareerStage
}

export function npstSummary(profile: NpstProfile = SAMPLE_PROFILE): NpstSummary {
  return {
    domains: profile.domains.length,
    competencyPct: competencyPct(profile),
    developmentAreas: developmentAreas(profile).length,
    atOrAboveExpected: profile.domains.filter((d) => d.current >= d.expected).length,
    readyToProgress: readyToProgress(profile),
    targetStage: profile.targetStage,
  }
}


export function toCSV(profile: NpstProfile = SAMPLE_PROFILE): string {
  const header = ["Domain", "Current", "Expected", "Gap"]
  const rows = profile.domains.map((d) => [d.name, String(d.current), String(d.expected), String(gap(d))].map(csvField).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
