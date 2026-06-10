import { test } from "node:test"
import assert from "node:assert/strict"
import {
  ASSIST_TASKS,
  taskByKey,
  byAutonomy,
  hitlTasks,
  invariantHolds,
  assistantSummary,
  toCSV,
} from "@/lib/agents/teacher-assistant"

test("tasks are well-formed with valid autonomy and confidence", () => {
  const keys = new Set<string>()
  for (const t of ASSIST_TASKS) {
    assert.ok(!keys.has(t.key), `duplicate ${t.key}`)
    keys.add(t.key)
    assert.ok(["suggest", "draft", "auto"].includes(t.autonomy))
    assert.ok(t.confidence >= 0 && t.confidence <= 100)
  }
})

test("the safety invariant holds: every high-stakes task is HITL-gated", () => {
  assert.equal(invariantHolds(), true)
  for (const t of ASSIST_TASKS) {
    if (t.highStakes) assert.equal(t.hitlRequired, true, `${t.key} is high-stakes but not HITL`)
  }
})

test("a constructed high-stakes task without HITL breaks the invariant (guard works)", () => {
  const bad = [...ASSIST_TASKS, { key: "x", name: "X", description: "", autonomy: "auto" as const, hitlRequired: false, confidence: 90, highStakes: true }]
  assert.equal(invariantHolds(bad), false)
})

test("auto tasks are read-only (not HITL); drafts require review", () => {
  assert.ok(byAutonomy("auto").every((t) => !t.hitlRequired && !t.highStakes))
  assert.equal(taskByKey("report-comments")?.hitlRequired, true)
  assert.ok(hitlTasks().length >= 1)
})

test("summary tallies HITL, autonomous, high-stakes and confidence", () => {
  const s = assistantSummary()
  assert.equal(s.tasks, ASSIST_TASKS.length)
  assert.equal(s.hitlRequired + s.autonomous, s.tasks)
  assert.equal(s.highStakes, ASSIST_TASKS.filter((t) => t.highStakes).length)
  assert.equal(s.invariantHolds, true)
  assert.ok(s.avgConfidence > 0 && s.avgConfidence <= 100)
})

test("CSV has a header plus one row per task", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Task,Autonomy,HITL,High-stakes,Confidence")
  assert.equal(lines.length, ASSIST_TASKS.length + 1)
})
