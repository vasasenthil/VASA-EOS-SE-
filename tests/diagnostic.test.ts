import { test } from "node:test"
import assert from "node:assert/strict"
import { classify, buildDiagnostic, diagnosticSummary } from "@/lib/diagnostic"

test("classify bands: >=60 at grade, >=35 one below, else two below", () => {
  assert.equal(classify(80), "at_grade")
  assert.equal(classify(60), "at_grade")
  assert.equal(classify(45), "one_below")
  assert.equal(classify(35), "one_below")
  assert.equal(classify(20), "two_below")
})

test("buildDiagnostic clamps scores and classifies each student", () => {
  const r = buildDiagnostic({})
  assert.ok(r.length > 0)
  assert.ok(r.every((x) => x.score >= 0 && x.score <= 100))
  assert.equal(diagnosticSummary([]).total, 0)
})

test("summary tallies levels and average", () => {
  const r = buildDiagnostic(Object.fromEntries(buildDiagnostic({}).map((x) => [x.apaarId, 90])))
  const s = diagnosticSummary(r)
  assert.equal(s.atGrade, r.length)
  assert.equal(s.avgScore, 90)
})
