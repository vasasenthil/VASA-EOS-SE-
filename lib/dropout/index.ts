// VASA-EOS(SE) — dropout-risk scoring (pure, deterministic, explainable).
//
// An advisory signal under human authority: it never decides anything, it surfaces at-risk
// learners with the REASONS that triggered the flag so a teacher/HM can act. Risk is derived from
// four observable factors — attendance, recent scores, fee default and a sibling-dropout history —
// each contributing a weighted, named trigger. Deterministic so the same maths runs in tests and
// on the dashboard, and so the flag is always explainable (no black box).

export type RiskBand = "High" | "Medium" | "Low"

export interface RiskFactors {
  attendancePct: number
  recentScorePct: number
  feeDefault: boolean
  siblingDropout: boolean
}

export interface RiskAssessment {
  score: number
  band: RiskBand
  triggers: string[]
}

// Thresholds (documented so the policy is auditable, not buried in magic numbers).
export const CHRONIC_ATTENDANCE_PCT = 75
export const LOW_ATTENDANCE_PCT = 85
export const LOW_SCORE_PCT = 35
export const BELOW_PAR_SCORE_PCT = 50
export const HIGH_BAND_SCORE = 50
export const MEDIUM_BAND_SCORE = 25

export function assessRisk(f: RiskFactors): RiskAssessment {
  let score = 0
  const triggers: string[] = []

  if (f.attendancePct < CHRONIC_ATTENDANCE_PCT) {
    score += 40
    triggers.push(`Chronic absenteeism (${f.attendancePct}%)`)
  } else if (f.attendancePct < LOW_ATTENDANCE_PCT) {
    score += 20
    triggers.push(`Below-par attendance (${f.attendancePct}%)`)
  }

  if (f.recentScorePct < LOW_SCORE_PCT) {
    score += 25
    triggers.push(`Very low recent scores (${f.recentScorePct}%)`)
  } else if (f.recentScorePct < BELOW_PAR_SCORE_PCT) {
    score += 10
    triggers.push(`Declining recent scores (${f.recentScorePct}%)`)
  }

  if (f.feeDefault) {
    score += 15
    triggers.push("Fee default")
  }

  if (f.siblingDropout) {
    score += 10
    triggers.push("Sibling dropout history")
  }

  const band: RiskBand = score >= HIGH_BAND_SCORE ? "High" : score >= MEDIUM_BAND_SCORE ? "Medium" : "Low"
  if (triggers.length === 0) triggers.push("No risk factors flagged")
  return { score, band, triggers }
}
