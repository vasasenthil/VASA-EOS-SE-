import { currentStep, type Decision } from "@/lib/workflow"
import { TC_ISSUANCE } from "@/lib/workflow/definitions"
import { actOnTc, fileTc, listTcs, type NewTc, type TcFlowRecord } from "@/lib/tcflow/store"
import { commitWithEvents } from "@/lib/events/outbox-publisher"
import { createWorkflowInstance } from "@/lib/workflow-runtime/store"
import { stableWorkflowInstanceId } from "@/lib/workflow-runtime/ids"
import { createEventEnvelope, type PlatformEvent } from "@/lib/events/schemas"

function workflowIdFor(record: TcFlowRecord): string {
  return stableWorkflowInstanceId("tc-issuance", record.id)
}

function workflowCreatedEvent(record: TcFlowRecord): PlatformEvent {
  const workflowId = workflowIdFor(record)
  return createEventEnvelope({
    eventType: "WorkflowInstanceCreated",
    aggregateType: "workflow",
    aggregateId: workflowId,
    idempotencyKey: `workflow:${workflowId}:created`,
    payload: {
      workflowId,
      definitionId: record.instance.defId,
      context: record.instance.context,
      status: "in_progress",
    },
  })
}

function tcFiledEvent(record: TcFlowRecord): PlatformEvent {
  const workflowId = workflowIdFor(record)
  return createEventEnvelope({
    eventType: "TransferCertificateFiled",
    aggregateType: "transfer_certificate",
    aggregateId: record.id,
    idempotencyKey: `tc:${record.id}:filed`,
    payload: {
      tcId: record.id,
      workflowId,
      student: record.student,
      needsCountersign: Boolean(record.details?.needsCountersign ?? record.instance.context.needsCountersign),
    },
  })
}

function workflowDecisionEvents(before: TcFlowRecord, after: TcFlowRecord, input: { actorRole: string; actor: string; decision: Decision; note?: string }): PlatformEvent[] {
  const previousStep = currentStep(TC_ISSUANCE, before.instance)
  const nextStep = currentStep(TC_ISSUANCE, after.instance)
  if (!previousStep) return []
  if (after.instance.status === "rejected") {
    return [createEventEnvelope({
      eventType: "WorkflowRejected",
      aggregateType: "workflow",
      aggregateId: workflowIdFor(after),
      idempotencyKey: `workflow:${workflowIdFor(after)}:rejected:${after.instance.history.length}`,
      actor: input.actor,
      payload: {
        workflowId: workflowIdFor(after),
        definitionId: after.instance.defId,
        rejectedAtStepId: previousStep.id,
        actorRole: input.actorRole,
        reason: input.note,
      },
    })]
  }
  if (after.instance.status === "approved") {
    return [
      createEventEnvelope({
        eventType: "WorkflowCompleted",
        aggregateType: "workflow",
        aggregateId: workflowIdFor(after),
        idempotencyKey: `workflow:${workflowIdFor(after)}:completed:${after.instance.history.length}`,
        actor: input.actor,
        payload: {
          workflowId: workflowIdFor(after),
          definitionId: after.instance.defId,
          finalStepId: previousStep.id,
          decision: input.decision === "resolve" ? "resolve" : "approve",
          actorRole: input.actorRole,
        },
      }),
      createEventEnvelope({
        eventType: "TransferCertificateIssued",
        aggregateType: "transfer_certificate",
        aggregateId: after.id,
        idempotencyKey: `tc:${after.id}:issued:${after.instance.history.length}`,
        actor: input.actor,
        payload: {
          tcId: after.id,
          workflowId: workflowIdFor(after),
          issuedBy: input.actor,
          finalStatus: "approved",
        },
      }),
    ]
  }
  return [createEventEnvelope({
    eventType: "WorkflowStepAdvanced",
    aggregateType: "workflow",
    aggregateId: workflowIdFor(after),
    idempotencyKey: `workflow:${workflowIdFor(after)}:advanced:${after.instance.history.length}`,
    actor: input.actor,
    payload: {
      workflowId: workflowIdFor(after),
      definitionId: after.instance.defId,
      previousStepId: previousStep.id,
      nextStepId: nextStep?.id,
      decision: "approve",
      actorRole: input.actorRole,
      stepIndex: after.instance.stepIndex,
    },
  })]
}

export async function fileTcWithOutbox(input: NewTc): Promise<TcFlowRecord> {
  const events: PlatformEvent[] = []
  return commitWithEvents(async () => {
    const record = await fileTc(input)
    await createWorkflowInstance({ id: workflowIdFor(record), workflowType: "tc-issuance", aggregateId: record.id, payload: { context: record.instance.context } })
    events.push(workflowCreatedEvent(record), tcFiledEvent(record))
    return record
  }, events)
}

export async function decideTcWithOutbox(input: { id: string; actorRole: string; actor: string; decision: Decision; note?: string }): Promise<{ ok: boolean; record?: TcFlowRecord; reason?: string }> {
  const existing = (await listTcs()).find((record) => record.id === input.id)
  const before = existing ? structuredClone(existing) : undefined
  const events: PlatformEvent[] = []
  return commitWithEvents(async () => {
    const result = await actOnTc(input.id, input)
    if (result.ok && before && result.record) events.push(...workflowDecisionEvents(before, result.record, input))
    return result
  }, events)
}
