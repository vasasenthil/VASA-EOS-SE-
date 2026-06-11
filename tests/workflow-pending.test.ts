import { test } from "node:test"
import assert from "node:assert/strict"
import { isAwaiting, countAwaiting } from "@/lib/workflow/pending"
import { startInstance, act } from "@/lib/workflow"
import { RECOGNITION_APPROVAL } from "@/lib/workflow/definitions"

// RECOGNITION_APPROVAL: BEO -> DEO -> Director (sequential).
function fresh() {
  return { instance: startInstance(RECOGNITION_APPROVAL, {}) }
}
function advance(item: { instance: ReturnType<typeof startInstance> }, role: string, actor: string) {
  return { instance: act(RECOGNITION_APPROVAL, item.instance, { actorRole: role, actor, decision: "approve" }).instance }
}

test("a fresh case is awaiting the first step (BEO), not later tiers", () => {
  const item = fresh()
  assert.equal(isAwaiting(item.instance, RECOGNITION_APPROVAL, "BEO"), true)
  assert.equal(isAwaiting(item.instance, RECOGNITION_APPROVAL, "DEO"), false)
  assert.equal(isAwaiting(item.instance, RECOGNITION_APPROVAL, "DIRECTOR"), false)
})

test("after BEO approves, the case moves to the DEO", () => {
  const item = advance(fresh(), "BEO", "Block Officer")
  assert.equal(isAwaiting(item.instance, RECOGNITION_APPROVAL, "BEO"), false)
  assert.equal(isAwaiting(item.instance, RECOGNITION_APPROVAL, "DEO"), true)
})

test("a fully approved case is awaiting no one", () => {
  let item = advance(fresh(), "BEO", "B")
  item = advance(item, "DEO", "D")
  item = advance(item, "DIRECTOR", "Dir")
  assert.equal(item.instance.status, "approved")
  assert.equal(isAwaiting(item.instance, RECOGNITION_APPROVAL, "DIRECTOR"), false)
})

test("countAwaiting tallies only the cases gated to the given role", () => {
  const items = [fresh(), fresh(), advance(fresh(), "BEO", "B")]
  assert.equal(countAwaiting(items, RECOGNITION_APPROVAL, "BEO"), 2)
  assert.equal(countAwaiting(items, RECOGNITION_APPROVAL, "DEO"), 1)
  assert.equal(countAwaiting(items, RECOGNITION_APPROVAL, "DIRECTOR"), 0)
  assert.equal(countAwaiting([], RECOGNITION_APPROVAL, "BEO"), 0)
})
