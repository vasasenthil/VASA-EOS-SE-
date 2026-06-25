// VASA-EOS(SE) — Student Early-Warning System (EWS): Native-AI wired across modules.
//
// This is where the platform stops being a CRUD MIS and becomes "AI assists, humans decide":
//   • The Analytics Engine (lib/ai/engines/analytics) runs over the cohort's attendance to surface
//     statistical outliers + trend (deterministic, explainable, humanAuthority).
//   • A transparent rule-based risk model fuses cross-module signals — Attendance Register +
//     Student Fees + Report Cards — into an explainable per-student risk level with factors.
//   • Every flag is ADVISORY: a human opens/acknowledges/resolves a case (HITL) — the AI never acts.
//
// Pure and client-safe; the server action joins the three stores and calls these.

import { analyse, type AnalyticsResult } from "@/lib/ai/engines/analytics"

export type RiskLevel = "Low" | "Medium" | "High"

export interface StudentSignals {
  student: string
  apaarId: string
  classLevel: string
  section: string
  attendancePct: number // 0–100 (Present + Late) / total
  attendanceCount: number // number of attendance records (drives confidence)
  feeBalance: number
  feeDefaulter: boolean
  academicPct: number | null // latest report-card % (null = no result yet)
  failedSubjects: number
}

export interface RiskFactor {
  label: string
  weight: number
  domain: "Attendance" | "Academic" | "Financial"
}

export interface RiskAssessment {
  student: string
  apaarId: string
  classLevel: string
  section: string
  score: number // 0–100
  level: RiskLevel
  factors: RiskFactor[]
  recommendation: string
  /** The platform's non-negotiable: AI flags, a human decides. */
  humanAuthority: true
}

export const RISK_LEVELS: RiskLevel[] = ["High", "Medium", "Low"]

function recommend(factors: RiskFactor[]): string {
  if (factors.length === 0) return "No intervention needed — continue routine monitoring."
  const top = [...factors].sort((a, b) => b.weight - a.weight)[0]
  switch (top.domain) {
    case "Attendance":
      return "Home visit / parent meeting and counsellor referral; check transport & health barriers."
    case "Academic":
      return "Enrol in remedial / bridge classes and peer mentoring; reassess after the next FA."
    case "Financial":
      return "Review scholarship / DBT eligibility and fee-concession options to remove the financial barrier."
  }
}

/** Transparent, explainable risk scoring fusing attendance, academic and financial signals. */
export function assessRisk(s: StudentSignals): RiskAssessment {
  const factors: RiskFactor[] = []
  if (s.attendanceCount > 0) {
    if (s.attendancePct < 60) factors.push({ label: `Chronic absence (${s.attendancePct}% attendance)`, weight: 40, domain: "Attendance" })
    else if (s.attendancePct < 75) factors.push({ label: `Low attendance (${s.attendancePct}%)`, weight: 20, domain: "Attendance" })
  }
  if (s.academicPct !== null) {
    if (s.failedSubjects > 0) factors.push({ label: `${s.failedSubjects} subject(s) below the pass mark`, weight: Math.min(35, 15 + s.failedSubjects * 10), domain: "Academic" })
    else if (s.academicPct < 50) factors.push({ label: `Low overall marks (${s.academicPct}%)`, weight: 15, domain: "Academic" })
  }
  if (s.feeDefaulter) factors.push({ label: `Fee defaulter (₹${Math.round(s.feeBalance).toLocaleString("en-IN")} overdue)`, weight: 15, domain: "Financial" })

  const score = Math.min(100, factors.reduce((a, f) => a + f.weight, 0))
  const level: RiskLevel = score >= 60 ? "High" : score >= 30 ? "Medium" : "Low"
  return { student: s.student, apaarId: s.apaarId, classLevel: s.classLevel, section: s.section, score, level, factors, recommendation: recommend(factors), humanAuthority: true }
}

export interface CohortInsight {
  analytics: AnalyticsResult
  /** Students whose attendance the engine flagged as a statistical outlier (by index). */
  outlierStudents: string[]
}

/**
 * Run the Analytics Engine over the cohort's attendance percentages. The engine returns the trend,
 * summary stats and the indices whose z-score is an outlier — we map those back to students "worth a
 * human look". Genuinely uses Engine 5, not a re-implementation.
 */
export function cohortInsight(assessments: Array<Pick<RiskAssessment, "student">>, attendancePcts: number[]): CohortInsight {
  const analytics = analyse(attendancePcts)
  const outlierStudents = analytics.anomalies.map((i) => assessments[i]?.student).filter((x): x is string => !!x)
  return { analytics, outlierStudents }
}

export interface RiskSummary {
  total: number
  high: number
  medium: number
  low: number
}

export function riskSummary(assessments: RiskAssessment[]): RiskSummary {
  return {
    total: assessments.length,
    high: assessments.filter((a) => a.level === "High").length,
    medium: assessments.filter((a) => a.level === "Medium").length,
    low: assessments.filter((a) => a.level === "Low").length,
  }
}

export interface AssessmentFilters {
  query?: string
  level?: string
  classLevel?: string
}

export function filterAssessments(all: RiskAssessment[], f: AssessmentFilters = {}): RiskAssessment[] {
  const q = (f.query ?? "").trim().toLowerCase()
  return all
    .filter((a) => {
      if (q && !(`${a.student} ${a.apaarId}`.toLowerCase().includes(q))) return false
      if (f.level && a.level !== f.level) return false
      if (f.classLevel && a.classLevel !== f.classLevel) return false
      return true
    })
    .sort((a, b) => b.score - a.score)
}
