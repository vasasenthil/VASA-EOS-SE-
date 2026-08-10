export interface EarlyWarningInput {
  attendancePct: number
  assessmentAverage: number
  assignmentCompletionPct: number
  consecutiveAbsences?: number
  namedHumanOwner: string
}

export interface EarlyWarningSignal {
  risk: "Low" | "Medium" | "High"
  score: number
  factors: string[]
  routedTo: string
  action: "monitor" | "teacher-review" | "counsellor-review"
  guardrail: string
}

export function earlyWarningSignal(input: EarlyWarningInput): EarlyWarningSignal {
  const factors: string[] = []
  let raw = 0
  if (input.attendancePct < 75) { raw += (75 - input.attendancePct) * 1.2; factors.push("attendance below 75%") }
  if (input.assessmentAverage < 40) { raw += (40 - input.assessmentAverage) * 0.9; factors.push("assessment average below 40%") }
  if (input.assignmentCompletionPct < 60) { raw += (60 - input.assignmentCompletionPct) * 0.5; factors.push("assignment completion below 60%") }
  if ((input.consecutiveAbsences ?? 0) >= 5) { raw += (input.consecutiveAbsences ?? 0) * 2; factors.push("consecutive absence streak") }

  const score = Math.min(1, Number((raw / 100).toFixed(3)))
  const risk: EarlyWarningSignal["risk"] = score >= 0.6 ? "High" : score >= 0.3 ? "Medium" : "Low"
  const action: EarlyWarningSignal["action"] = risk === "High" ? "counsellor-review" : risk === "Medium" ? "teacher-review" : "monitor"

  return {
    risk,
    score,
    factors: factors.length ? factors : ["no elevated deterministic risk factor"],
    routedTo: input.namedHumanOwner,
    action,
    guardrail: "Prediction is advisory only: every alert routes to a named human; no automated denial, profiling action or benefit decision.",
  }
}
