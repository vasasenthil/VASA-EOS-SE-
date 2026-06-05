// VASA-EOS(SE) — question bank & paper blueprint (Flagship 05 / assessment).
// Questions tagged by subject/difficulty/marks; assemble a paper toward a target.

export type Difficulty = "easy" | "medium" | "hard"

export interface Question {
  id: string
  subject: string
  text: string
  difficulty: Difficulty
  marks: number
}

export const PAPER_TARGET = 100

export const QUESTION_BANK: Question[] = [
  { id: "q1", subject: "Mathematics", text: "Solve 2x + 3 = 11", difficulty: "easy", marks: 2 },
  { id: "q2", subject: "Mathematics", text: "Prove the Pythagorean theorem", difficulty: "hard", marks: 8 },
  { id: "q3", subject: "Science", text: "State Newton's three laws", difficulty: "medium", marks: 5 },
  { id: "q4", subject: "Science", text: "Explain photosynthesis", difficulty: "medium", marks: 5 },
  { id: "q5", subject: "Tamil", text: "Write a paragraph on Thirukkural", difficulty: "easy", marks: 4 },
  { id: "q6", subject: "Social Science", text: "Causes of the freedom struggle", difficulty: "hard", marks: 10 },
]

export function newQuestionId(): string {
  return `q-${Math.random().toString(36).slice(2, 8)}`
}

export interface PaperSummary {
  count: number
  totalMarks: number
  byDifficulty: Record<Difficulty, number>
  meetsTarget: boolean
}

export function paperSummary(selected: Question[], target: number = PAPER_TARGET): PaperSummary {
  const byDifficulty: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 }
  let totalMarks = 0
  for (const q of selected) {
    byDifficulty[q.difficulty] += q.marks
    totalMarks += q.marks
  }
  return { count: selected.length, totalMarks, byDifficulty, meetsTarget: totalMarks === target }
}
