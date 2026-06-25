import { test } from "node:test"
import assert from "node:assert/strict"
import { ELIGIBILITY_CRITERIA, RECOGNITION_STAGES } from "@/lib/recognition"
import {
  STATUTORY_DECISION_DAYS,
  RECOGNITION_PIPELINE,
  daysElapsed,
  isOverdue,
  completenessPct,
  oversightQueue,
  oversightSummary,
  toCSV,
} from "@/lib/recognition/oversight"

// Fixed reference clock for deterministic statutory-clock assertions.
const NOW = new Date("2026-06-10T00:00:00Z")

test("days elapsed counts from the received date", () => {
  const a = RECOGNITION_PIPELINE.find((x) => x.id === "REC-2047")! // received 2026-05-25
  assert.equal(daysElapsed(a, NOW), 16)
})

test("overdue = in progress past the statutory window; decided apps are never overdue", () => {
  const overdue = RECOGNITION_PIPELINE.find((x) => x.id === "REC-2043")! // received 2025-12-01, in_progress
  const within = RECOGNITION_PIPELINE.find((x) => x.id === "REC-2042")! // received 2026-05-01, in_progress
  const recognised = RECOGNITION_PIPELINE.find((x) => x.id === "REC-2044")! // decided
  assert.ok(daysElapsed(overdue, NOW) > STATUTORY_DECISION_DAYS)
  assert.equal(isOverdue(overdue, NOW), true)
  assert.equal(isOverdue(within, NOW), false)
  assert.equal(isOverdue(recognised, NOW), false) // even though it is old, it is decided
})

test("completeness reflects the share of statutory criteria met", () => {
  const full = RECOGNITION_PIPELINE.find((x) => x.id === "REC-2044")! // all criteria
  const partial = RECOGNITION_PIPELINE.find((x) => x.id === "REC-2047")! // 1 of N
  assert.equal(completenessPct(full), 100)
  assert.equal(completenessPct(partial), Math.round((1 / ELIGIBILITY_CRITERIA.length) * 100))
})

test("the oversight queue holds only in-flight apps, longest-pending first", () => {
  const q = oversightQueue(NOW)
  assert.ok(q.every((o) => o.application.status === "in_progress"))
  for (let i = 1; i < q.length; i++) assert.ok(q[i - 1].elapsed >= q[i].elapsed)
  // every queued stage is a real pipeline stage
  for (const o of q) assert.ok((RECOGNITION_STAGES as readonly string[]).includes(o.stage))
})

test("summary tallies status, overdue and average completeness honestly", () => {
  const s = oversightSummary(NOW)
  assert.equal(s.total, RECOGNITION_PIPELINE.length)
  assert.equal(s.inProgress + s.recognised + s.rejected, s.total)
  assert.equal(s.recognised, 1)
  assert.equal(s.rejected, 1)
  assert.equal(s.overdue, 2) // REC-2041 and REC-2043
  assert.ok(s.avgCompletenessPct > 0 && s.avgCompletenessPct <= 100)
  assert.equal(s.byStage.reduce((n, x) => n + x.count, 0), s.inProgress)
})

test("CSV has a header plus one row per in-flight application", () => {
  const lines = toCSV(NOW).split("\r\n").filter(Boolean)
  assert.equal(lines[0], "ID,School,District,Type,Stage,Elapsed days,Overdue,Completeness %")
  assert.equal(lines.length, oversightQueue(NOW).length + 1)
})
