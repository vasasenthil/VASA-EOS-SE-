// VASA-EOS(SE) — Adaptive Learning Engine (Flagship 07 / Sec 16 Pillar 2).
// Bayesian Knowledge Tracing (BKT) for per-skill mastery + IRT/ZPD next-item
// selection (challenging but not overwhelming). Pure functions; the UI drives a
// live adaptive session.

export interface Skill {
  id: string
  name: string
}

export interface Item {
  id: string
  skillId: string
  difficulty: number // 0..1
  prompt: string
  options: string[]
  answerIndex: number
}

export const SKILLS: Skill[] = [
  { id: "frac", name: "Fractions" },
  { id: "place", name: "Place Value" },
]

export const ITEM_BANK: Item[] = [
  { id: "i1", skillId: "frac", difficulty: 0.25, prompt: "1/2 + 1/2 = ?", options: ["1", "1/4", "2", "0"], answerIndex: 0 },
  { id: "i2", skillId: "frac", difficulty: 0.45, prompt: "1/2 + 1/4 = ?", options: ["3/4", "2/6", "1/8", "1"], answerIndex: 0 },
  { id: "i3", skillId: "frac", difficulty: 0.65, prompt: "2/3 + 1/6 = ?", options: ["5/6", "3/9", "1/2", "3/6"], answerIndex: 0 },
  { id: "i4", skillId: "frac", difficulty: 0.85, prompt: "3/4 - 2/3 = ?", options: ["1/12", "1/7", "5/12", "1/2"], answerIndex: 0 },
  { id: "i5", skillId: "place", difficulty: 0.3, prompt: "Digit in tens place of 472?", options: ["7", "4", "2", "47"], answerIndex: 0 },
  { id: "i6", skillId: "place", difficulty: 0.6, prompt: "Value of 5 in 3,508?", options: ["500", "5", "50", "5000"], answerIndex: 0 },
]

// BKT parameters (illustrative).
const P_SLIP = 0.1
const P_GUESS = 0.2
const P_LEARN = 0.15

/** Update P(mastery) given an observed correct/incorrect response. */
export function bktUpdate(prior: number, correct: boolean): number {
  const num = correct ? prior * (1 - P_SLIP) : prior * P_SLIP
  const den = correct ? prior * (1 - P_SLIP) + (1 - prior) * P_GUESS : prior * P_SLIP + (1 - prior) * (1 - P_GUESS)
  const posterior = den > 0 ? num / den : prior
  // learning transition (the student may have learned from the item)
  return Math.min(1, posterior + (1 - posterior) * P_LEARN)
}

/** ZPD next-item: difficulty just above current mastery, within the skill. */
export function selectNextItem(items: Item[], skillId: string, mastery: number): Item | undefined {
  const pool = items.filter((i) => i.skillId === skillId)
  if (pool.length === 0) return undefined
  const target = Math.min(0.95, mastery + 0.1)
  return pool.reduce((best, cur) =>
    Math.abs(cur.difficulty - target) < Math.abs(best.difficulty - target) ? cur : best,
  )
}

export const MASTERY_THRESHOLD = 0.85
