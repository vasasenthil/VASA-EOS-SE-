import { test } from "node:test"
import assert from "node:assert/strict"
import { buildDailyTasks, dayProgress, streak } from "@/lib/today"

test("buildDailyTasks always leads with attendance and is priority-sorted", () => {
  const tasks = buildDailyTasks()
  assert.equal(tasks[0].kind, "attendance")
  for (let i = 1; i < tasks.length; i++) {
    assert.ok(tasks[i - 1].priority >= tasks[i].priority)
  }
})

test("buildDailyTasks derives follow-ups / nudges / IEP reviews from the roster", () => {
  const tasks = buildDailyTasks()
  assert.ok(tasks.some((t) => t.kind === "follow_up"))
  assert.ok(tasks.some((t) => t.kind === "nudge"))
  assert.ok(tasks.some((t) => t.kind === "iep_review"))
})

test("dayProgress computes percentage and completion, clamped", () => {
  assert.deepEqual(dayProgress(4, 1), { total: 4, done: 1, pct: 25, complete: false })
  assert.deepEqual(dayProgress(4, 4), { total: 4, done: 4, pct: 100, complete: true })
  assert.equal(dayProgress(4, 9).done, 4) // clamped
  assert.equal(dayProgress(0, 0).pct, 100) // empty list = nothing to do
})

test("streak counts consecutive completed days from the end", () => {
  assert.equal(streak([true, true, true]), 3)
  assert.equal(streak([true, false, true, true]), 2)
  assert.equal(streak([false]), 0)
  assert.equal(streak([]), 0)
})
