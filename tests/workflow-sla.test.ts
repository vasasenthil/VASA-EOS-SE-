import { test } from "node:test"
import assert from "node:assert/strict"
import { pendingSince, caseAgeDays, slaBadge, DEFAULT_SLA_DAYS } from "@/lib/workflow/sla"
import { startInstance, act } from "@/lib/workflow"
import { RECOGNITION_APPROVAL } from "@/lib/workflow/definitions"

const NOW = new Date("2026-06-20T00:00:00.000Z")
function daysAgo(n: number) {
  return new Date(NOW.getTime() - n * 86_400_000).toISOString()
}

test("a fresh case ages from when it was filed", () => {
  const inst = startInstance(RECOGNITION_APPROVAL, {}, "i1", daysAgo(3))
  assert.equal(pendingSince(inst), daysAgo(3))
  assert.equal(caseAgeDays(inst, NOW), 3)
})

test("after an action, ageing resets to the last decision time", () => {
  let inst = startInstance(RECOGNITION_APPROVAL, {}, "i2", daysAgo(10))
  inst = act(RECOGNITION_APPROVAL, inst, { actorRole: "BEO", actor: "B", decision: "approve", at: daysAgo(2) }).instance
  assert.equal(caseAgeDays(inst, NOW), 2) // waiting 2 days at the DEO step, not 10
})

test("the SLA badge escalates ontime -> due -> overdue", () => {
  assert.equal(slaBadge(startInstance(RECOGNITION_APPROVAL, {}, "a", daysAgo(1)), NOW)?.tone, "ontime")
  assert.equal(slaBadge(startInstance(RECOGNITION_APPROVAL, {}, "b", daysAgo(5)), NOW)?.tone, "due")
  const over = slaBadge(startInstance(RECOGNITION_APPROVAL, {}, "c", daysAgo(DEFAULT_SLA_DAYS + 1)), NOW)
  assert.equal(over?.tone, "overdue")
  assert.match(over?.label ?? "", /overdue/)
})

test("a finished case has no SLA badge", () => {
  let inst = startInstance(RECOGNITION_APPROVAL, {}, "d", daysAgo(30))
  for (const role of ["BEO", "DEO", "DIRECTOR"]) {
    inst = act(RECOGNITION_APPROVAL, inst, { actorRole: role, actor: role, decision: "approve", at: daysAgo(1) }).instance
  }
  assert.equal(inst.status, "approved")
  assert.equal(slaBadge(inst, NOW), null)
})

test("an unknown start time yields no age and no badge", () => {
  const inst = { ...startInstance(RECOGNITION_APPROVAL, {}, "e"), startedAt: undefined }
  assert.equal(caseAgeDays(inst, NOW), undefined)
  assert.equal(slaBadge(inst, NOW), null)
})
