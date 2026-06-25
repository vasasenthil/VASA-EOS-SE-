import { test } from "node:test"
import assert from "node:assert/strict"
import {
  RTE_PTR,
  SCHOOL_CADRE,
  requiredTeachers,
  balance,
  vacancy,
  classify,
  redeploymentPlan,
  planToTransferRequests,
  cadreSummary,
  toCSV,
} from "@/lib/postings/cadre"

test("required teachers is enrolment over PTR, rounded up", () => {
  assert.equal(requiredTeachers({ school: "x", district: "d", enrolment: 300, sanctioned: 0, working: 0 }), 10)
  assert.equal(requiredTeachers({ school: "x", district: "d", enrolment: 301, sanctioned: 0, working: 0 }), 11) // ceil
  assert.equal(RTE_PTR, 30)
})

test("balance, vacancy and classification are consistent", () => {
  const madurai = SCHOOL_CADRE.find((c) => c.school === "Govt HSS Madurai")! // 300 enrol, req 10, working 13
  assert.equal(balance(madurai), 3)
  assert.equal(classify(madurai), "surplus")
  const coimbatore = SCHOOL_CADRE.find((c) => c.school === "Govt HS Coimbatore")! // 450 enrol, req 15, working 12
  assert.equal(balance(coimbatore), -3)
  assert.equal(classify(coimbatore), "deficit")
  assert.equal(vacancy(coimbatore), 4) // sanctioned 16 - working 12
  const chennai = SCHOOL_CADRE.find((c) => c.school === "Govt MS Chennai")! // 240 enrol, req 8, working 8
  assert.equal(classify(chennai), "balanced")
})

test("summary tallies surplus/deficit/balanced and redeployable posts", () => {
  const s = cadreSummary()
  assert.equal(s.schools, SCHOOL_CADRE.length)
  assert.equal(s.surplus + s.deficit + s.balanced, s.schools)
  assert.equal(s.surplusPosts, 7) // +3, +2, +2
  assert.equal(s.deficitPosts, 8) // -3, -2, -3
  assert.equal(s.redeployable, 7) // min(surplus, deficit)
  assert.ok(s.statePtr > 0)
})

test("the redeployment plan never moves more than the available surplus", () => {
  const plan = redeploymentPlan()
  const moved = plan.reduce((n, m) => n + m.count, 0)
  assert.equal(moved, cadreSummary().redeployable) // exactly the redeployable count
  assert.ok(plan.every((m) => m.count > 0 && m.from !== m.to))
})

test("the plan renders as counselling-based draft transfer requests", () => {
  const reqs = planToTransferRequests()
  assert.equal(reqs.length, redeploymentPlan().length)
  assert.ok(reqs.every((r) => r.status === "requested"))
  assert.ok(reqs.every((r) => r.reason.includes("RTE")))
})

test("CSV has a header plus one row per school", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "School,District,Enrolment,Required,Working,Vacancy,Balance,Class")
  assert.equal(lines.length, SCHOOL_CADRE.length + 1)
})
