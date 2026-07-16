import assert from "node:assert/strict"
import test from "node:test"

import { dispatchOutboxBatch, resetDispatcherState } from "@/lib/events/outbox-dispatcher"
import { listOutboxEvents, resetMemoryOutbox } from "@/lib/events/outbox-publisher"
import { decideScholarshipWithOutbox, fileScholarshipWithOutbox } from "@/lib/stores/scholarship-store"
import { processWorkflowEvent, wireWorkflowEngineToOutbox } from "@/lib/workflow-runtime/engine"
import { stableWorkflowInstanceId } from "@/lib/workflow-runtime/ids"
import { runSlaMonitor } from "@/lib/workflow-runtime/sla-monitor"
import { getWorkflowInstance, resetWorkflowRuntimeStore, saveWorkflowInstance } from "@/lib/workflow-runtime/store"

test.beforeEach(() => {
  resetDispatcherState()
  resetMemoryOutbox()
  resetWorkflowRuntimeStore()
})

test("workflow runtime starts, advances from outbox events, times out and compensates in reverse", async () => {
  const unsubscribe = wireWorkflowEngineToOutbox()
  const filed = await fileScholarshipWithOutbox({ student: "Meena", scheme: "Merit", amount: 1000 })
  const workflowId = stableWorkflowInstanceId("scholarship-sanction", filed.id)

  const started = await getWorkflowInstance(workflowId)
  assert.equal(started?.status, "running")
  assert.equal(started?.currentStepIndex, 0)

  await dispatchOutboxBatch({ workerId: "runtime-test", batchSize: 10 })
  await decideScholarshipWithOutbox({ id: filed.id, actorRole: "PRINCIPAL", actor: "HM", decision: "approve" })
  await dispatchOutboxBatch({ workerId: "runtime-test", batchSize: 10 })

  const advanced = await getWorkflowInstance(workflowId)
  assert.equal(advanced?.currentStepIndex, 1)
  assert.equal(advanced?.payload.history.length, 1)
  assert.equal(advanced?.payload.history[0].stepName, "Headmaster verification")

  await saveWorkflowInstance({ ...advanced!, currentStepStartedAt: "2026-07-14T00:00:00.000Z" })
  assert.deepEqual(await runSlaMonitor(new Date("2026-07-17T00:00:00.000Z")), { scanned: 1, timedOut: 1 })

  const compensating = await getWorkflowInstance(workflowId)
  assert.equal(compensating?.status, "compensating")
  await dispatchOutboxBatch({ workerId: "runtime-test", batchSize: 10 })

  const compensated = await getWorkflowInstance(workflowId)
  assert.equal(compensated?.status, "rejected")
  assert.equal(compensated?.payload.compensations.length, 1)
  assert.equal(compensated?.payload.compensations[0].stepName, "Headmaster verification")

  const eventTypes = (await listOutboxEvents()).map((row) => row.event.eventType)
  assert.ok(eventTypes.includes("WorkflowStepTimedOut"))
  assert.ok(eventTypes.includes("CompensationExecuted"))
  unsubscribe()
})

test("processWorkflowEvent is idempotent for repeated advance events", async () => {
  const filed = await fileScholarshipWithOutbox({ student: "Rani", scheme: "Merit", amount: 1000 })
  const workflowId = stableWorkflowInstanceId("scholarship-sanction", filed.id)
  await decideScholarshipWithOutbox({ id: filed.id, actorRole: "PRINCIPAL", actor: "HM", decision: "approve" })
  const event = (await listOutboxEvents()).find((row) => row.event.eventType === "WorkflowStepAdvanced")?.event
  assert.ok(event)

  await processWorkflowEvent(event)
  await processWorkflowEvent(event)

  const instance = await getWorkflowInstance(workflowId)
  assert.equal(instance?.currentStepIndex, 1)
  assert.equal(instance?.payload.history.length, 1)
})
