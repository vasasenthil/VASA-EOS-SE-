import { test } from "node:test"
import assert from "node:assert/strict"
import { gradeFor, pointsFor, computeHpc, HPC_SUBJECTS, coScholasticGrade, computeCoScholastic, CO_SCHOLASTIC_DOMAINS } from "@/lib/hpc"

test("grade bands map marks correctly (and clamp)", () => {
  assert.equal(gradeFor(95), "A1")
  assert.equal(gradeFor(85), "A2")
  assert.equal(gradeFor(72), "B1")
  assert.equal(gradeFor(40), "D")
  assert.equal(gradeFor(20), "E")
  assert.equal(gradeFor(150), "A1") // clamped
  assert.equal(gradeFor(-5), "E")
})

test("grade points follow the band", () => {
  assert.equal(pointsFor("A1"), 10)
  assert.equal(pointsFor("E"), 0)
})

test("computeHpc aggregates percentage, CGPA and a descriptor", () => {
  const marks = Object.fromEntries(HPC_SUBJECTS.map((s) => [s, 95]))
  const r = computeHpc(marks)
  assert.equal(r.percentage, 95)
  assert.equal(r.cgpa, 10)
  assert.equal(r.subjects.length, HPC_SUBJECTS.length)
  assert.match(r.descriptor, /Outstanding/)
})

test("missing subjects default to zero", () => {
  const r = computeHpc({})
  assert.equal(r.total, 0)
  assert.equal(r.percentage, 0)
  assert.equal(r.cgpa, 0)
})

test("co-scholastic grade bands map 1-5 to A-D (clamped)", () => {
  assert.equal(coScholasticGrade(5), "A")
  assert.equal(coScholasticGrade(4), "A")
  assert.equal(coScholasticGrade(3), "B")
  assert.equal(coScholasticGrade(2), "C")
  assert.equal(coScholasticGrade(1), "D")
  assert.equal(coScholasticGrade(9), "A")
})

test("computeCoScholastic covers all domains and defaults missing to 3 (B)", () => {
  const res = computeCoScholastic({ "Life Skills": 5 })
  assert.equal(res.length, CO_SCHOLASTIC_DOMAINS.length)
  assert.equal(res.find((r) => r.domain === "Life Skills")?.grade, "A")
  assert.ok(res.every((r) => r.rating >= 1 && r.rating <= 5))
})
