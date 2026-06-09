// VASA-EOS(SE) — parent feedback / satisfaction survey (Sec 48 / community voice).
// 1-5 ratings across standard dimensions. Pure averaging + summary helpers.

export const SURVEY_QUESTIONS = [
  "Teaching quality",
  "Communication with parents",
  "Safety & cleanliness",
  "Meals (CMBS)",
  "Overall satisfaction",
]

export interface FeedbackResponse {
  id: string
  ratings: Record<string, number> // question -> 1..5
  comment?: string
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/** Mean of a single response's ratings (0 if none). */
export function avgRating(response: FeedbackResponse, questions: string[] = SURVEY_QUESTIONS): number {
  const vals = questions.map((q) => response.ratings[q]).filter((v) => typeof v === "number")
  if (vals.length === 0) return 0
  return round1(vals.reduce((a, b) => a + b, 0) / vals.length)
}

export interface FeedbackSummary {
  responses: number
  overallAvg: number
  perQuestion: Record<string, number>
}

export function feedbackSummary(responses: FeedbackResponse[], questions: string[] = SURVEY_QUESTIONS): FeedbackSummary {
  const perQuestion: Record<string, number> = {}
  for (const q of questions) {
    const vals = responses.map((r) => r.ratings[q]).filter((v) => typeof v === "number")
    perQuestion[q] = vals.length === 0 ? 0 : round1(vals.reduce((a, b) => a + b, 0) / vals.length)
  }
  const all = responses.flatMap((r) => questions.map((q) => r.ratings[q]).filter((v) => typeof v === "number"))
  return {
    responses: responses.length,
    overallAvg: all.length === 0 ? 0 : round1(all.reduce((a, b) => a + b, 0) / all.length),
    perQuestion,
  }
}
