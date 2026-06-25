import { test } from "node:test"
import assert from "node:assert/strict"
import {
  ENGINES,
  ENGINE_COUNT,
  reason,
  personalise,
  assess,
  projectPolicy,
  analyse,
  converse,
} from "@/lib/ai/engines"

test("the registry exposes exactly six engines, all advisory", () => {
  assert.equal(ENGINE_COUNT, 6)
  assert.deepEqual(
    ENGINES.map((e) => e.id).sort(),
    ["analytics", "assessment", "conversational", "personalisation", "policy", "reasoning"],
  )
})

test("Reasoning: fires rules whose conditions all hold, with explanations", () => {
  const r = reason({
    facts: { category: "EWS", age: 7, distanceKm: 0.5 },
    rules: [
      { id: "rte25", when: [{ key: "category", op: "eq", value: "EWS" }, { key: "age", op: "gte", value: 6 }], then: "RTE 25% eligible", because: "EWS child aged ≥ 6 under RTE §12(1)(c)" },
      { id: "neighbourhood", when: [{ key: "distanceKm", op: "lte", value: 1 }], then: "Neighbourhood school", because: "Within 1 km norm" },
      { id: "noFire", when: [{ key: "category", op: "eq", value: "General" }], then: "should not fire", because: "n/a" },
    ],
  })
  assert.equal(r.confidence, 1)
  assert.deepEqual(r.conclusions.map((c) => c.ruleId).sort(), ["neighbourhood", "rte25"])
  assert.ok(!r.conclusions.some((c) => c.ruleId === "noFire"))
})

test("Personalisation: recommends only ready objectives, gap-ranked", () => {
  const syllabus = [
    { id: "add", label: "Addition", prereqs: [] },
    { id: "mul", label: "Multiplication", prereqs: ["add"] },
    { id: "div", label: "Division", prereqs: ["mul"] },
  ]
  const r = personalise({ mastery: { add: 0.9, mul: 0.2 }, syllabus })
  // add mastered -> mul ready; div blocked (mul not mastered)
  assert.deepEqual(r.recommendations.map((x) => x.objectiveId), ["mul"])
  assert.equal(r.confidence, 1)
})

test("Assessment: scores against a rubric and flags weak objectives", () => {
  const rubric = [
    { id: "q1", marks: 10, objective: "Algebra" },
    { id: "q2", marks: 10, objective: "Algebra" },
    { id: "q3", marks: 10, objective: "Geometry" },
  ]
  const r = assess(rubric, [
    { itemId: "q1", awarded: 9 },
    { itemId: "q2", awarded: 8 },
    { itemId: "q3", awarded: 3 },
  ])
  assert.equal(r.score, 20)
  assert.equal(r.max, 30)
  assert.equal(r.pct, 67)
  assert.deepEqual(r.weakObjectives, ["Geometry"]) // 3/10 = 30% < 50%
})

test("Policy: projects newly-covered, cost and clamps coverage", () => {
  const r = projectPolicy({ population: 100000, baselineCoverage: 0.6, unitCost: 200 }, { label: "Breakfast scheme", targetCoverage: 0.85 })
  assert.equal(r.newlyCovered, 25000)
  assert.equal(r.indicativeCost, 5000000)
  assert.equal(Math.round(r.projectedCoverage * 100), 85)
  // a target below baseline yields no effect
  assert.equal(projectPolicy({ population: 100, baselineCoverage: 0.9, unitCost: 1 }, { label: "x", targetCoverage: 0.5 }).newlyCovered, 0)
})

test("Analytics: stats, trend and anomaly detection", () => {
  const r = analyse([90, 91, 89, 92, 50]) // 50 is an outlier; series trends down at the end
  assert.equal(r.n, 5)
  assert.ok(r.anomalies.includes(4))
  assert.equal(analyse([]).confidence, 0)
})

test("Conversational: grounded answer with citations, honest when nothing matches", () => {
  const corpus = [
    { id: "d1", text: "Under RTE 2009, the pupil-teacher ratio norm is 30 to 1 at the primary level.", source: "RTE-2009" },
    { id: "d2", text: "Mid-day meals are provided to all enrolled children.", source: "MDM-GO" },
  ]
  const r = converse("What is the pupil teacher ratio norm?", corpus)
  assert.equal(r.grounded, true)
  assert.equal(r.citations[0].source, "RTE-2009")
  assert.ok(r.confidence > 0)
  const none = converse("quantum chromodynamics", corpus)
  assert.equal(none.grounded, false)
  assert.equal(none.citations.length, 0)
})
