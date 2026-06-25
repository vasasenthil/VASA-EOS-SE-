import { test } from "node:test"
import assert from "node:assert/strict"
import { trackerDemoData } from "@/lib/tracking/demo"

test("the NEP tracker demo dataset is complete and flagged as demo", () => {
  const d = trackerDemoData()
  assert.equal(d.demo, true)
  assert.ok(d.stats.length >= 4)
  assert.ok(d.policyProgress.length >= 5)
  assert.ok(d.nepThrustAreaProgress.length >= 5)
  assert.ok(d.stateImplementationProgress.length >= 5)
  assert.ok(!d.error, "demo data must not carry a fatal error")
})

test("progress values are sane percentages and statuses are from the distinct set", () => {
  const d = trackerDemoData()
  for (const p of d.policyProgress) {
    assert.ok(p.progress >= 0 && p.progress <= 100, `${p.id} progress out of range`)
    assert.ok(d.distinctStatuses.includes(p.status), `${p.id} status not in distinctStatuses`)
  }
  for (const n of d.nepThrustAreaProgress) assert.ok(n.value >= 0 && n.value <= 100)
  for (const s of d.stateImplementationProgress) assert.ok(s.value >= 0 && s.value <= 100)
})
