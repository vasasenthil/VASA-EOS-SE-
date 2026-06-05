import { test } from "node:test"
import assert from "node:assert/strict"
import { gradeFor, pointsFor, computeHpc, HPC_SUBJECTS } from "@/lib/hpc"

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
