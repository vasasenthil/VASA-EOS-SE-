import { subscribeToPlatformEvents } from "@/lib/events/outbox-dispatcher"
import { commitWithEvents } from "@/lib/events/outbox-publisher"
import { createEventEnvelope, type PlatformEvent } from "@/lib/events/schemas"
import { getWorkflowInstance, saveWorkflowInstance } from "./store"
import { parseWorkflowPayload, workflowDefinitionFor } from "./schema"
import { compensateWorkflowFromEvent } from "./compensation"

type EngineEvent = Extract<PlatformEvent, { eventType: "WorkflowStepAdvanced" | "WorkflowCompleted" | "WorkflowRejected" | "WorkflowStepTimedOut" }>

function isEngineEvent(event: PlatformEvent): event is EngineEvent {
  return event.eventType === "WorkflowStepAdvanced" || event.eventType === "WorkflowCompleted" || event.eventType === "WorkflowRejected" || event.eventType === "WorkflowStepTimedOut"
}

export async function processWorkflowEvent(event: PlatformEvent): Promise<void> {
  if (!isEngineEvent(event)) return
  if (event.eventType === "WorkflowStepTimedOut" || event.eventType === "WorkflowRejected") {
    await compensateWorkflowFromEvent(event)
    return
  }

  const workflowId = event.payload.workflowId
  const instance = await getWorkflowInstance(workflowId)
  if (!instance) return
  const definition = workflowDefinitionFor(instance.workflowType)
  const payload = parseWorkflowPayload(instance.payload)

  if (event.eventType === "WorkflowCompleted") {
    if (instance.status === "completed") return
    const events: PlatformEvent[] = []
    await commitWithEvents(async () => {
      await saveWorkflowInstance({ ...instance, status: "completed", payload })
    }, events)
    return
  }

  if (instance.status !== "running") return
  const previousStepIndex = Math.max(0, event.payload.stepIndex - 1)
  const previousStep = definition.steps[previousStepIndex]
  const nextStep = definition.steps[event.payload.stepIndex]
  if (!previousStep) return
  if (event.payload.stepIndex <= instance.currentStepIndex) return

  const events: PlatformEvent[] = []
  await commitWithEvents(async () => {
    payload.history.push({
      stepIndex: previousStepIndex,
      stepName: previousStep.stepName,
      completedAt: event.occurredAt,
      eventId: event.id,
      compensateAction: previousStep.compensateAction,
    })
    if (!nextStep) {
      await saveWorkflowInstance({ ...instance, status: "completed", currentStepIndex: event.payload.stepIndex, payload })
      events.push(createEventEnvelope({
        eventType: "WorkflowCompleted",
        aggregateType: "workflow",
        aggregateId: instance.id,
        idempotencyKey: `workflow-runtime:${instance.id}:completed:${event.id}`,
        causationId: event.id,
        correlationId: event.correlationId ?? event.id,
        payload: {
          workflowId: instance.id,
          definitionId: instance.workflowType,
          finalStepId: previousStep.stepName,
          decision: "approve",
          actorRole: event.payload.actorRole,
        },
      }))
      return
    }
    await saveWorkflowInstance({
      ...instance,
      currentStepIndex: event.payload.stepIndex,
      payload,
      currentStepStartedAt: event.occurredAt,
    })
  }, events)
}

export function wireWorkflowEngineToOutbox(): () => void {
  return subscribeToPlatformEvents("*", (event) => processWorkflowEvent(event))
}
