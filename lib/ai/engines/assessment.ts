// VASA-EOS(SE) — Assessment Engine (Engine 3 of 6).
//
// Scoring + diagnosis: given a rubric (items, each with marks and an objective tag) and a
// learner's awarded marks per item, it computes the total, percentage, a grade band, and
// per-objective mastery — surfacing the weak objectives that need remediation. Deterministic
// and explainable. Advisory: it informs a teacher; it never autonomously rates a teacher.

export interface RubricItem {
  id: string
  marks: number
  objective: string
}

export interface ItemResponse {
  itemId: string
  awarded: number
}

export interface ObjectiveMastery {
  objective: string
  awarded: number
  max: number
  pct: number
}

export interface AssessmentResult {
  score: number
  max: number
  pct: number
  band: string
  objectiveMastery: ObjectiveMastery[]
  /** Objectives scored below 50% — candidates for remediation. */
  weakObjectives: string[]
  confidence: number
  explanation: string
  humanAuthority: true
}

function band(pct: number): string {
  if (pct >= 91) return "A1"
  if (pct >= 81) return "A2"
  if (pct >= 71) return "B1"
  if (pct >= 61) return "B2"
  if (pct >= 51) return "C1"
  if (pct >= 41) return "C2"
  if (pct >= 33) return "D"
  return "E"
}

export function assess(rubric: RubricItem[], responses: ItemResponse[]): AssessmentResult {
  const awardedById = new Map(responses.map((r) => [r.itemId, r.awarded]))
  const max = rubric.reduce((s, i) => s + i.marks, 0)
  let score = 0
  const byObj = new Map<string, { awarded: number; max: number }>()
  for (const item of rubric) {
    const raw = awardedById.get(item.id) ?? 0
    const awarded = Math.max(0, Math.min(item.marks, raw)) // clamp to [0, marks]
    score += awarded
    const o = byObj.get(item.objective) ?? { awarded: 0, max: 0 }
    o.awarded += awarded
    o.max += item.marks
    byObj.set(item.objective, o)
  }
  const pct = max === 0 ? 0 : Math.round((score / max) * 100)
  const objectiveMastery: ObjectiveMastery[] = [...byObj.entries()].map(([objective, v]) => ({
    objective,
    awarded: v.awarded,
    max: v.max,
    pct: v.max === 0 ? 0 : Math.round((v.awarded / v.max) * 100),
  }))
  const weakObjectives = objectiveMastery.filter((o) => o.pct < 50).map((o) => o.objective)
  const explanation = `Scored ${score}/${max} (${pct}%, band ${band(pct)}). ${
    weakObjectives.length ? `Weak: ${weakObjectives.join(", ")}.` : "No weak objectives."
  }`
  return {
    score,
    max,
    pct,
    band: band(pct),
    objectiveMastery,
    weakObjectives,
    confidence: rubric.length ? 1 : 0,
    explanation,
    humanAuthority: true,
  }
}
