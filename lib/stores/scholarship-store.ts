import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import { currentStep, startInstance, type Decision } from "@/lib/workflow"
import { SCHOLARSHIP_SANCTION } from "@/lib/workflow/definitions"
import {
  actOnScholarship,
  fileScholarship,
  listScholarships,
  type NewScholarship,
  type ScholarshipFlowRecord,
} from "@/lib/scholarshipflow/store"
import { commitWithEvents } from "@/lib/events/outbox-publisher"
import { getDb } from "@/lib/persistence"
import { scholarshipFileWithOutboxRpc } from "@/lib/events/atomic-rpc"
import { createWorkflowInstance } from "@/lib/workflow-runtime/store"
import { stableWorkflowInstanceId } from "@/lib/workflow-runtime/ids"
import { createEventEnvelope, type PlatformEvent } from "@/lib/events/schemas"

function workflowIdFor(record: ScholarshipFlowRecord): string {
  return stableWorkflowInstanceId("scholarship-sanction", record.id)
}

function workflowCreatedEvent(record: ScholarshipFlowRecord): PlatformEvent {
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

function scholarshipFiledEvent(record: ScholarshipFlowRecord): PlatformEvent {
  const workflowId = workflowIdFor(record)
  return createEventEnvelope({
    eventType: "ScholarshipFiled",
    aggregateType: "scholarship",
    aggregateId: record.id,
    idempotencyKey: `scholarship:${record.id}:filed`,
    payload: {
      scholarshipId: record.id,
      workflowId,
      student: record.student,
      scheme: record.scheme,
      amount: record.amount,
      tenantId: record.tenantId ?? DEFAULT_SCHOOL_NODE,
    },
  })
}

function workflowDecisionEvents(before: ScholarshipFlowRecord, after: ScholarshipFlowRecord, input: { actorRole: string; actor: string; decision: Decision; note?: string }): PlatformEvent[] {
  const previousStep = currentStep(SCHOLARSHIP_SANCTION, before.instance)
  const nextStep = currentStep(SCHOLARSHIP_SANCTION, after.instance)
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
    const events: PlatformEvent[] = [createEventEnvelope({
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
    })]
    events.push(createEventEnvelope({
      eventType: "ScholarshipSanctioned",
      aggregateType: "scholarship",
      aggregateId: after.id,
      idempotencyKey: `scholarship:${after.id}:sanctioned:${after.instance.history.length}`,
      actor: input.actor,
      payload: {
        scholarshipId: after.id,
        workflowId: workflowIdFor(after),
        scheme: after.scheme,
        amount: after.amount,
        sanctionedBy: input.actor,
        finalStatus: "approved",
      },
    }))
    return events
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

export async function fileScholarshipWithOutbox(input: NewScholarship): Promise<ScholarshipFlowRecord> {
  const db = getDb()
  if (db) {
    const record: ScholarshipFlowRecord = {
      id: `SCH-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      student: input.student,
      scheme: input.scheme,
      amount: input.amount,
      instance: startInstance(SCHOLARSHIP_SANCTION, { amount: input.amount }),
      details: input.details,
      tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE,
    }
    const events = [workflowCreatedEvent(record), scholarshipFiledEvent(record)]
    await scholarshipFileWithOutboxRpc({
      id: record.id,
      student: record.student,
      scheme: record.scheme,
      amount: record.amount,
      instance: record.instance,
      context: record.instance.context,
      details: record.details ?? {},
      tenantId: record.tenantId,
      workflowId: workflowIdFor(record),
    }, events)
    return record
  }

  const events: PlatformEvent[] = []
  return commitWithEvents(async () => {
    const record = await fileScholarship(input)
    await createWorkflowInstance({ id: workflowIdFor(record), workflowType: "scholarship-sanction", aggregateId: record.id, payload: { context: record.instance.context } })
    events.push(workflowCreatedEvent(record), scholarshipFiledEvent(record))
    return record
  }, events)
}

export async function decideScholarshipWithOutbox(input: { id: string; actorRole: string; actor: string; decision: Decision; note?: string }): Promise<{ ok: boolean; record?: ScholarshipFlowRecord; reason?: string }> {
  const existing = (await listScholarships()).find((record) => record.id === input.id)
  const before = existing ? structuredClone(existing) : undefined
  const events: PlatformEvent[] = []
  return commitWithEvents(async () => {
    const result = await actOnScholarship(input.id, input)
    if (result.ok && before && result.record) events.push(...workflowDecisionEvents(before, result.record, input))
    return result
  }, events)
}
