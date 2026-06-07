import { test } from "node:test"
import assert from "node:assert/strict"
import { startInstance, act, currentStep, canAct, effectiveSteps, progress, type WorkflowInstance } from "@/lib/workflow"
import { LEAVE_APPROVAL, SMC_RESOLUTION, RECOGNITION_APPROVAL } from "@/lib/workflow/definitions"

const at = "2026-06-06T00:00:00.000Z"

test("single-step path: short leave needs only the Principal", () => {
  let inst = startInstance(LEAVE_APPROVAL, { days: 2 }, "i1")
  assert.equal(effectiveSteps(LEAVE_APPROVAL, inst.context).length, 1) // BEO + DEO skipped
  assert.equal(currentStep(LEAVE_APPROVAL, inst)?.approverRole, "PRINCIPAL")

  const r = act(LEAVE_APPROVAL, inst, { actorRole: "PRINCIPAL", actor: "HM", decision: "approve", at })
  assert.equal(r.ok, true)
  assert.equal(r.instance.status, "approved")
})

test("role-gating: the wrong role cannot act", () => {
  const inst = startInstance(LEAVE_APPROVAL, { days: 2 }, "i2")
  assert.equal(canAct(LEAVE_APPROVAL, inst, "BEO"), false)
  const r = act(LEAVE_APPROVAL, inst, { actorRole: "BEO", actor: "X", decision: "approve", at })
  assert.equal(r.ok, false)
  assert.match(r.reason ?? "", /requires role PRINCIPAL/)
  assert.equal(r.instance.status, "in_progress") // unchanged
})

test("dynamic routing: long leave adds BEO then DEO", () => {
  let inst = startInstance(LEAVE_APPROVAL, { days: 20 }, "i3")
  assert.equal(effectiveSteps(LEAVE_APPROVAL, inst.context).length, 3)

  inst = act(LEAVE_APPROVAL, inst, { actorRole: "PRINCIPAL", actor: "HM", decision: "approve", at }).instance
  assert.equal(currentStep(LEAVE_APPROVAL, inst)?.approverRole, "BEO")
  inst = act(LEAVE_APPROVAL, inst, { actorRole: "BEO", actor: "B", decision: "approve", at }).instance
  assert.equal(currentStep(LEAVE_APPROVAL, inst)?.approverRole, "DEO")
  inst = act(LEAVE_APPROVAL, inst, { actorRole: "DEO", actor: "D", decision: "approve", at }).instance
  assert.equal(inst.status, "approved")
  assert.equal(inst.history.length, 3)
})

test("reject at any step terminates the instance", () => {
  let inst = startInstance(LEAVE_APPROVAL, { days: 20 }, "i4")
  inst = act(LEAVE_APPROVAL, inst, { actorRole: "PRINCIPAL", actor: "HM", decision: "approve", at }).instance
  const r = act(LEAVE_APPROVAL, inst, { actorRole: "BEO", actor: "B", decision: "reject", at, note: "norms" })
  assert.equal(r.instance.status, "rejected")
  assert.equal(currentStep(LEAVE_APPROVAL, r.instance), null)
})

test("multiple approvers: SMC needs a quorum of 3 before advancing", () => {
  let inst = startInstance(SMC_RESOLUTION, {}, "i5")
  for (let i = 0; i < 2; i++) {
    inst = act(SMC_RESOLUTION, inst, { actorRole: "PARENT", actor: `m${i}`, decision: "approve", at }).instance
    assert.equal(inst.status, "in_progress")
    assert.equal(currentStep(SMC_RESOLUTION, inst)?.id, "members") // still gathering quorum
  }
  inst = act(SMC_RESOLUTION, inst, { actorRole: "PARENT", actor: "m3", decision: "approve", at }).instance
  assert.equal(currentStep(SMC_RESOLUTION, inst)?.id, "chair") // quorum met → advanced
  inst = act(SMC_RESOLUTION, inst, { actorRole: "PRINCIPAL", actor: "HM", decision: "approve", at }).instance
  assert.equal(inst.status, "approved")
})

test("three-level sequential recognition + progress reporting", () => {
  let inst = startInstance(RECOGNITION_APPROVAL, {}, "i6")
  assert.deepEqual(
    [progress(RECOGNITION_APPROVAL, inst).total, progress(RECOGNITION_APPROVAL, inst).step],
    [3, 0],
  )
  inst = act(RECOGNITION_APPROVAL, inst, { actorRole: "BEO", actor: "B", decision: "approve", at }).instance
  inst = act(RECOGNITION_APPROVAL, inst, { actorRole: "DEO", actor: "D", decision: "approve", at }).instance
  assert.equal(progress(RECOGNITION_APPROVAL, inst).pct, 67)
  inst = act(RECOGNITION_APPROVAL, inst, { actorRole: "DIRECTOR", actor: "Dir", decision: "approve", at }).instance
  assert.equal(inst.status, "approved")
  assert.equal(progress(RECOGNITION_APPROVAL, inst).pct, 100)
})

test("acting on a finished instance is rejected", () => {
  const done: WorkflowInstance = { id: "x", defId: "leave-approval", context: { days: 1 }, status: "approved", stepIndex: 1, approvalsInStep: 0, history: [] }
  const r = act(LEAVE_APPROVAL, done, { actorRole: "PRINCIPAL", actor: "HM", decision: "approve", at })
  assert.equal(r.ok, false)
})
