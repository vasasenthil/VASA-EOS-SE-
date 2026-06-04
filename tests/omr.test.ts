import { test } from "node:test"
import assert from "node:assert/strict"
import { scoreOmr, ANSWER_KEY } from "@/lib/omr"

test("full marks when every answer matches the key", () => {
  const marked = Object.fromEntries(ANSWER_KEY.map((k) => [k.q, k.key]))
  const s = scoreOmr(marked)
  assert.equal(s.correct, s.total)
  assert.equal(s.pct, 100)
})

test("empty sheet scores zero", () => {
  const s = scoreOmr({})
  assert.equal(s.correct, 0)
  assert.equal(s.pct, 0)
})

test("partial marking scores proportionally and flags wrong answers", () => {
  const first = ANSWER_KEY[0]
  const s = scoreOmr({ [first.q]: first.key })
  assert.equal(s.correct, 1)
  const row = s.perQuestion.find((p) => p.q === first.q)
  assert.equal(row?.correct, true)
})
