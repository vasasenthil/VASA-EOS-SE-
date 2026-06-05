import { test } from "node:test"
import assert from "node:assert/strict"
import { fitnessSummary, gradeFor, FITNESS_TESTS, type FitnessRecord } from "@/lib/fitness"

const r = (student: string, score: number): FitnessRecord => ({
  id: `r-${Math.random()}`,
  student,
  cls: "7A",
  test: FITNESS_TESTS[0],
  score,
  grade: gradeFor(score),
})

test("grading bands at 40 and 70", () => {
  assert.equal(gradeFor(39), "Needs improvement")
  assert.equal(gradeFor(40), "Healthy")
  assert.equal(gradeFor(69), "Healthy")
  assert.equal(gradeFor(70), "Excellent")
})

test("test catalogue is non-empty", () => {
  assert.ok(FITNESS_TESTS.includes("Speed (50m dash)"))
})

test("summary counts distinct students, average and grade tallies", () => {
  const s = fitnessSummary([r("A", 80), r("A", 30), r("B", 60)])
  assert.equal(s.records, 3)
  assert.equal(s.students, 2)
  assert.equal(s.avgScore, 57) // (80+30+60)/3 = 56.67 -> 57
  assert.equal(s.excellent, 1)
  assert.equal(s.needsAttention, 1)
})

test("empty register yields zero average", () => {
  assert.equal(fitnessSummary([]).avgScore, 0)
})
