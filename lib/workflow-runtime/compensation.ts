import { commitWithEvents } from "@/lib/events/outbox-publisher"
import { createEventEnvelope, type PlatformEvent } from "@/lib/events/schemas"
import { getWorkflowInstance, saveWorkflowInstance } from "./store"
import { COMPENSATION_REGISTRY, parseWorkflowPayload } from "./schema"

type CompensationTrigger = Extract<PlatformEvent, { eventType: "WorkflowStepTimedOut" | "WorkflowRejected" }>

export interface CompensationResult {
  workflowId: string
  executed: number
}

export async function compensateWorkflowFromEvent(event: CompensationTrigger): Promise<CompensationResult> {
  const workflowId = event.payload.workflowId
  const instance = await getWorkflowInstance(workflowId)
  if (!instance) return { workflowId, executed: 0 }
  const payload = parseWorkflowPayload(instance.payload)
  const already = new Set(payload.compensations.map((item) => `${item.stepName}:${item.compensateAction}`))
  const completed = [...payload.history].reverse().filter((item) => item.compensateAction && !already.has(`${item.stepName}:${item.compensateAction}`))
  const events: PlatformEvent[] = []

  await commitWithEvents(async () => {
    for (const item of completed) {
      if (!item.compensateAction) continue
      const action = COMPENSATION_REGISTRY[item.compensateAction]
      const result = await action({
        workflowInstanceId: instance.id,
        workflowType: instance.workflowType,
        aggregateId: instance.aggregateId,
        stepName: item.stepName,
        payload,
      })
      payload.compensations.push({
        stepName: item.stepName,
        compensateAction: item.compensateAction,
        compensatedAt: event.occurredAt,
        eventId: event.id,
      })
      events.push(createEventEnvelope({
        eventType: "CompensationExecuted",
        aggregateType: "workflow",
        aggregateId: instance.id,
        idempotencyKey: `workflow:${instance.id}:compensation:${item.stepName}:${item.compensateAction}`,
        causationId: event.id,
        correlationId: event.correlationId ?? event.id,
        payload: {
          workflowId: instance.id,
          definitionId: instance.workflowType,
          compensatedStepName: item.stepName,
          compensateAction: item.compensateAction,
          detail: result.detail,
        },
      }))
    }
    await saveWorkflowInstance({ ...instance, status: "rejected", payload })
  }, events)

  return { workflowId, executed: events.length }
}
