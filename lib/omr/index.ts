// VASA-EOS(SE) — OCR / OMR Engine (Sec 56 / Flagship 05).
// Smartphone OMR scoring (objective sections) + Tamil/English ICR for handwriting.
// Pure scoring here; on-device vision + child-handwriting OCR sit behind the seam.

export const OMR_OPTIONS = ["A", "B", "C", "D"] as const
export type OmrOption = (typeof OMR_OPTIONS)[number]

export interface AnswerKeyEntry {
  q: number
  key: OmrOption
}

export const ANSWER_KEY: AnswerKeyEntry[] = [
  { q: 1, key: "A" },
  { q: 2, key: "C" },
  { q: 3, key: "B" },
  { q: 4, key: "D" },
  { q: 5, key: "A" },
  { q: 6, key: "B" },
  { q: 7, key: "C" },
  { q: 8, key: "A" },
]

export interface OmrPerQuestion {
  q: number
  marked: string
  key: string
  correct: boolean
}

export interface OmrScore {
  correct: number
  total: number
  pct: number
  perQuestion: OmrPerQuestion[]
}

export function scoreOmr(marked: Record<number, string>): OmrScore {
  const perQuestion: OmrPerQuestion[] = ANSWER_KEY.map((k) => {
    const m = marked[k.q] ?? "—"
    return { q: k.q, marked: m, key: k.key, correct: m === k.key }
  })
  const correct = perQuestion.filter((p) => p.correct).length
  const total = ANSWER_KEY.length
  return { correct, total, pct: Math.round((correct / total) * 100), perQuestion }
}
