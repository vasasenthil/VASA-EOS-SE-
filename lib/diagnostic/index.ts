// VASA-EOS(SE) — diagnostic / learning-level assessment (Sec 16 / FLN baseline).
// Classify each learner's level from a diagnostic score and summarise the class.

import { SIS_ROSTER } from "@/lib/sis"

export type LearningLevel = "at_grade" | "one_below" | "two_below"

export const LEVEL_LABELS: Record<LearningLevel, string> = {
  at_grade: "At grade level",
  one_below: "One level below",
  two_below: "Two+ levels below",
}

/** >= 60 at grade, 35-59 one below, < 35 two-plus below. */
export function classify(score: number): LearningLevel {
  if (score >= 60) return "at_grade"
  if (score >= 35) return "one_below"
  return "two_below"
}

export interface DiagResult {
  apaarId: string
  name: string
  score: number
  level: LearningLevel
}

export function buildDiagnostic(scores: Record<string, number>): DiagResult[] {
  return SIS_ROSTER.map((s) => {
    const score = Math.max(0, Math.min(100, scores[s.apaarId] ?? 0))
    return { apaarId: s.apaarId, name: s.name, score, level: classify(score) }
  })
}

export interface DiagSummary {
  total: number
  atGrade: number
  oneBelow: number
  twoBelow: number
  avgScore: number
}

export function diagnosticSummary(results: DiagResult[]): DiagSummary {
  if (results.length === 0) return { total: 0, atGrade: 0, oneBelow: 0, twoBelow: 0, avgScore: 0 }
  return {
    total: results.length,
    atGrade: results.filter((r) => r.level === "at_grade").length,
    oneBelow: results.filter((r) => r.level === "one_below").length,
    twoBelow: results.filter((r) => r.level === "two_below").length,
    avgScore: Math.round(results.reduce((s, r) => s + r.score, 0) / results.length),
  }
}
