import assert from "node:assert/strict"
import test from "node:test"
import { listOutboxEvents, resetMemoryOutbox } from "@/lib/events/outbox-publisher"
import { decideWorkflowStep, WorkflowDecisionError } from "@/lib/workflow-runtime/decision-service"
import { createWorkflowInstance, getWorkflowInstance, resetWorkflowRuntimeStore } from "@/lib/workflow-runtime/store"

test.beforeEach(() => { resetMemoryOutbox(); resetWorkflowRuntimeStore() })

test("persists an approval round and emits advancement atomically", async () => {
  await createWorkflowInstance({ id: "10000000-0000-4000-8000-000000000001", workflowType: "scholarship-sanction", aggregateId: "sch-1", payload: { context: { initiatorId: "student-1", jurisdictionId: "school-1" } }, now: "2026-07-29T00:00:00.000Z" })
  const result = await decideWorkflowStep({ workflowId: "10000000-0000-4000-8000-000000000001", expectedStepIndex: 0, actor: { id: "hm-1", roles: ["PRINCIPAL"], jurisdictionId: "school-1" }, decision: "approve", now: "2026-07-29T01:00:00.000Z" })
  assert.equal(result.state, "approved")
  const stored = await getWorkflowInstance(result.workflowId)
  assert.equal(stored?.payload.approvals[0].decisions[0].actorId, "hm-1")
  assert.equal((await listOutboxEvents()).at(-1)?.event.eventType, "WorkflowStepAdvanced")
})

test("reject persists evidence and emits rejection", async () => {
  await createWorkflowInstance({ id: "10000000-0000-4000-8000-000000000002", workflowType: "scholarship-sanction", aggregateId: "sch-2", payload: { context: { initiatorId: "student-1", jurisdictionId: "school-1" } } })
  const result = await decideWorkflowStep({ workflowId: "10000000-0000-4000-8000-000000000002", expectedStepIndex: 0, actor: { id: "hm-1", roles: ["PRINCIPAL"], jurisdictionId: "school-1" }, decision: "reject", comment: "Evidence mismatch" })
  assert.equal(result.state, "rejected")
  assert.equal((await listOutboxEvents()).at(-1)?.event.eventType, "WorkflowRejected")
})

test("optimistic step check blocks stale approvals", async () => {
  await createWorkflowInstance({ id: "10000000-0000-4000-8000-000000000003", workflowType: "scholarship-sanction", aggregateId: "sch-3", payload: { context: { initiatorId: "student-1", jurisdictionId: "school-1" } } })
  await assert.rejects(() => decideWorkflowStep({ workflowId: "10000000-0000-4000-8000-000000000003", expectedStepIndex: 1, actor: { id: "hm-1", roles: ["PRINCIPAL"], jurisdictionId: "school-1" }, decision: "approve" }), (error) => error instanceof WorkflowDecisionError && error.code === "STEP_MISMATCH")
  assert.equal((await listOutboxEvents()).length, 0)
})
