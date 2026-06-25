import { test } from "node:test"
import assert from "node:assert/strict"
import { SURVEY_QUESTIONS, avgRating, feedbackSummary, type FeedbackResponse } from "@/lib/feedback"

function resp(value: number): FeedbackResponse {
  return { id: `r${value}`, ratings: Object.fromEntries(SURVEY_QUESTIONS.map((q) => [q, value])) }
}

test("avgRating averages a response's ratings", () => {
  assert.equal(avgRating(resp(4)), 4)
  assert.equal(avgRating({ id: "x", ratings: {} }), 0)
})

test("feedbackSummary computes per-question and overall averages", () => {
  const s = feedbackSummary([resp(5), resp(3)])
  assert.equal(s.responses, 2)
  assert.equal(s.overallAvg, 4)
  for (const q of SURVEY_QUESTIONS) assert.equal(s.perQuestion[q], 4)
})

test("empty survey is zeroed", () => {
  const s = feedbackSummary([])
  assert.equal(s.responses, 0)
  assert.equal(s.overallAvg, 0)
})
