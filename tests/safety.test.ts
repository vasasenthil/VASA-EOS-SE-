import { test } from "node:test"
import assert from "node:assert/strict"
import { nextSafetyStatus, safetySummary, SAFETY_FLOW, type SafetyConcern } from "@/lib/safety"

const c = (status: SafetyConcern["status"], category = "Fire safety"): SafetyConcern => ({
  id: `c-${Math.random()}`,
  category,
  description: "d",
  action: "a",
  status,
  date: "2026-06-05",
  tenantId: "TN-CHN-B1-S1",
})

test("status advances through the flow and clamps at resolved", () => {
  assert.equal(nextSafetyStatus("reported"), "under_review")
  assert.equal(nextSafetyStatus("under_review"), "resolved")
  assert.equal(nextSafetyStatus("resolved"), "resolved")
})

test("flow has three ordered stages", () => {
  assert.deepEqual(SAFETY_FLOW, ["reported", "under_review", "resolved"])
})

test("summary counts open, resolved and anti-ragging", () => {
  const s = safetySummary([
    c("reported", "Anti-ragging"),
    c("under_review"),
    c("resolved"),
  ])
  assert.equal(s.total, 3)
  assert.equal(s.open, 2)
  assert.equal(s.resolved, 1)
  assert.equal(s.antiRagging, 1)
})
