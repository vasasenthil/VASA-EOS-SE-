// VASA-EOS(SE) — Personalisation Engine (Engine 2 of 6).
//
// Adaptive next-step recommendation: given a learner's mastery per objective and a syllabus
// of objectives with prerequisites, it recommends the objectives the learner is READY to
// learn next — not yet mastered, but with every prerequisite mastered — ranked by the size
// of the gap. Deterministic and explainable. Advisory: a teacher decides what to teach.

export interface Objective {
  id: string
  label: string
  /** Objective ids that must be mastered first. */
  prereqs: string[]
}

export interface PersonalisationInput {
  /** mastery[objectiveId] in [0,1]; absent = 0. */
  mastery: Record<string, number>
  syllabus: Objective[]
  /** Mastery at/above this counts as "mastered" (default 0.7). */
  threshold?: number
}

export interface Recommendation {
  objectiveId: string
  label: string
  reason: string
  /** Higher = more urgent (larger gap, all prerequisites met). */
  priority: number
}

export interface PersonalisationResult {
  recommendations: Recommendation[]
  confidence: number
  explanation: string
  humanAuthority: true
}

const DEFAULT_THRESHOLD = 0.7

export function personalise(input: PersonalisationInput): PersonalisationResult {
  const t = input.threshold ?? DEFAULT_THRESHOLD
  const m = (id: string) => input.mastery[id] ?? 0
  const mastered = (id: string) => m(id) >= t

  const ready = input.syllabus.filter((o) => !mastered(o.id) && o.prereqs.every(mastered))
  const recommendations: Recommendation[] = ready
    .map((o) => ({
      objectiveId: o.id,
      label: o.label,
      reason: o.prereqs.length
        ? `Prerequisites met (${o.prereqs.join(", ")}); current mastery ${(m(o.id) * 100).toFixed(0)}%.`
        : `Foundational objective; current mastery ${(m(o.id) * 100).toFixed(0)}%.`,
      priority: Math.round((t - m(o.id)) * 100),
    }))
    .sort((a, b) => b.priority - a.priority)

  const blocked = input.syllabus.filter((o) => !mastered(o.id) && !o.prereqs.every(mastered)).length
  const explanation = recommendations.length
    ? `${recommendations.length} objective(s) ready now; ${blocked} blocked on prerequisites.`
    : blocked > 0
      ? `Nothing ready yet — ${blocked} objective(s) await prerequisites.`
      : "All objectives are already mastered."
  const confidence = input.syllabus.length ? 1 : 0
  return { recommendations, confidence, explanation, humanAuthority: true }
}
