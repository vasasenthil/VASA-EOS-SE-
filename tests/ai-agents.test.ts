import { test } from "node:test"
import assert from "node:assert/strict"
import {
  AGENTS,
  AGENT_COUNT,
  agentSpec,
  runPolicyAgent,
  runTeacherAgent,
  runStudentAgent,
  runGovernanceAgent,
  runGrievanceAgent,
  runComplianceAgent,
} from "@/lib/ai/agents"

test("there are six agents, each with the full five-part anatomy", () => {
  assert.equal(AGENT_COUNT, 6)
  for (const a of AGENTS) {
    assert.ok(a.goal && a.perception && a.cognition.length >= 1 && a.action && a.oversight, `${a.id} missing anatomy`)
  }
  assert.deepEqual(AGENTS.map((a) => a.id).sort(), ["compliance", "governance", "grievance", "policy", "student", "teacher"])
})

test("every recommendation is advisory; high-stakes agents always need human approval", () => {
  const r = runPolicyAgent({ baseline: { population: 100000, baselineCoverage: 0.6, unitCost: 200 }, lever: { label: "Breakfast", targetCoverage: 0.85 } })
  assert.equal(r.humanAuthority, true)
  assert.equal(agentSpec("policy").highStakes, true)
  assert.equal(r.requiresHumanApproval, true) // high-stakes
  assert.match(r.summary, /coverage/i)
})

test("Teacher Agent composes assessment + personalisation into a remediation plan", () => {
  const r = runTeacherAgent({
    rubric: [ { id: "q1", marks: 10, objective: "Algebra" }, { id: "q2", marks: 10, objective: "Geometry" } ],
    responses: [ { itemId: "q1", awarded: 9 }, { itemId: "q2", awarded: 2 } ],
    syllabus: [ { id: "add", label: "Addition", prereqs: [] }, { id: "mul", label: "Multiplication", prereqs: ["add"] } ],
    mastery: { add: 0.9 },
  })
  assert.deepEqual(r.enginesUsed, ["assessment", "personalisation"])
  assert.match(r.summary, /Geometry/) // weak objective surfaced
  assert.match(r.detail, /Multiplication/) // ready next objective
})

test("Compliance Agent derives findings from facts and flags for sign-off", () => {
  const r = runComplianceAgent({
    facts: { ptr: 45, toiletsGenderSegregated: false },
    rules: [
      { id: "ptr", when: [{ key: "ptr", op: "gte", value: 31 }], then: "PTR breach (RTE norm 30:1)", because: "PTR 45 exceeds 30:1" },
      { id: "toilet", when: [{ key: "toiletsGenderSegregated", op: "eq", value: false }], then: "Missing gender-segregated toilets", because: "RTE/RPwD infrastructure norm" },
    ],
  })
  assert.equal(r.requiresHumanApproval, true) // compliance is high-stakes
  assert.match(r.summary, /PTR breach/)
  assert.match(r.summary, /toilets/i)
})

test("Governance, Student and Grievance agents return grounded, bounded confidence", () => {
  const g = runGovernanceAgent({ indicator: [90, 91, 89, 92, 50] })
  assert.match(g.summary, /anomaly/)
  const s = runStudentAgent({ mastery: { add: 0.9 }, syllabus: [ { id: "add", label: "Addition", prereqs: [] }, { id: "mul", label: "Multiplication", prereqs: ["add"] } ], question: "What is the PTR norm?", corpus: [ { id: "d1", text: "The PTR norm under RTE is 30 to 1.", source: "RTE-2009" } ] })
  assert.match(s.summary, /Multiplication/)
  const gr = runGrievanceAgent({ facts: { tier: "block" }, rules: [ { id: "b", when: [{ key: "tier", op: "eq", value: "block" }], then: "Block (BEO)", because: "Block-tier grievance" } ], query: "fee refund policy", corpus: [ { id: "d", text: "Fee refunds are processed within 30 days.", source: "Fee-GO" } ] })
  assert.match(gr.summary, /Block/)
  for (const r of [g, s, gr]) assert.ok(r.confidence >= 0 && r.confidence <= 1)
})
