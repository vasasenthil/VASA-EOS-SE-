import { test } from "node:test"
import assert from "node:assert/strict"
import { paperSummary, PAPER_TARGET, type Question } from "@/lib/question-bank"

const q = (marks: number, difficulty: Question["difficulty"]): Question => ({ id: `q${marks}${difficulty}`, subject: "X", text: "t", difficulty, marks })

test("paperSummary totals marks and difficulty mix", () => {
  const s = paperSummary([q(2, "easy"), q(8, "hard"), q(5, "medium")])
  assert.equal(s.count, 3)
  assert.equal(s.totalMarks, 15)
  assert.equal(s.byDifficulty.easy, 2)
  assert.equal(s.byDifficulty.medium, 5)
  assert.equal(s.byDifficulty.hard, 8)
  assert.equal(s.meetsTarget, false)
})

test("meetsTarget is true exactly at the target", () => {
  assert.equal(paperSummary([q(PAPER_TARGET, "medium")]).meetsTarget, true)
  assert.equal(paperSummary([]).totalMarks, 0)
})
