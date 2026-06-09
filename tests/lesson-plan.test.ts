import { test } from "node:test"
import assert from "node:assert/strict"
import { planCompleteness, isClassroomReady, type LessonPlan } from "@/lib/lesson-plan"

const full: LessonPlan = {
  id: "x",
  subject: "Maths",
  className: "9-A",
  topic: "Fractions",
  objectives: "Add fractions",
  materials: "Strips",
  date: "2026-06-08",
}

test("a fully-filled plan is 100% and classroom-ready", () => {
  assert.equal(planCompleteness(full), 100)
  assert.equal(isClassroomReady(full), true)
})

test("missing fields lower completeness proportionally", () => {
  const partial = { ...full, objectives: "", materials: "", date: "" }
  assert.equal(planCompleteness(partial), 50) // 3 of 6 fields
  assert.equal(isClassroomReady(partial), false)
})

test("whitespace does not count as filled", () => {
  assert.equal(planCompleteness({ ...full, topic: "   " }), Math.round((5 / 6) * 100))
})
