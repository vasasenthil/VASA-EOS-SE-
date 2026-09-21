import { commitWithEvents } from "@/lib/events/outbox-publisher"
import { createEventEnvelope, type PlatformEvent } from "@/lib/events/schemas"
import { createWorkflowInstance, getWorkflowInstance } from "@/lib/workflow-runtime/store"
import { getScheme, schemeWorkflowId, saveSchemeRecord } from "./scheme-store"
import "@/lib/schemes/workflow-definition"

export async function proposeScheme(schemeId: string, proposedBy: string): Promise<void> {
  const scheme = await getScheme(schemeId)
  if (!scheme) throw new Error(`Scheme not found: ${schemeId}`)
  const workflowId = scheme.workflowId ?? schemeWorkflowId(scheme.id)
  const events: PlatformEvent[] = [createEventEnvelope({ eventType: "SchemeProposed" as any, aggregateType: "scheme", aggregateId: scheme.id, idempotencyKey: `scheme:${scheme.id}:proposed:${workflowId}`, actor: proposedBy, payload: { schemeId: scheme.id, workflowId, proposedBy, status: "under_review" } } as any), createEventEnvelope({ eventType: "WorkflowInstanceCreated", aggregateType: "workflow", aggregateId: workflowId, idempotencyKey: `workflow:${workflowId}:created`, actor: proposedBy, payload: { workflowId, definitionId: "scheme-approval", context: { schemeId: scheme.id, budget: scheme.budget, category: scheme.category }, status: "in_progress" } })]
  await commitWithEvents(async () => {
    if (!(await getWorkflowInstance(workflowId))) await createWorkflowInstance({ id: workflowId, workflowType: "scheme-approval", aggregateId: scheme.id, payload: { context: { budget: scheme.budget, category: scheme.category, proposedBy } } })
    await saveSchemeRecord({ ...scheme, status: "under_review", workflowId, updatedAt: new Date().toISOString() })
  }, events)
}

export async function approveSchemeStep(workflowId: string, stepIndex: number, approver: string, comments: string): Promise<void> {
  const workflow = await getWorkflowInstance(workflowId)
  if (!workflow) throw new Error(`Workflow not found: ${workflowId}`)
  const scheme = await getScheme(workflow.aggregateId)
  if (!scheme) throw new Error(`Scheme not found: ${workflow.aggregateId}`)
  const nextIndex = stepIndex + 1
  const events: PlatformEvent[] = [
    createEventEnvelope({ eventType: "SchemeStepApproved" as any, aggregateType: "scheme", aggregateId: scheme.id, idempotencyKey: `scheme:${scheme.id}:step-approved:${stepIndex}:${approver}`, actor: approver, payload: { schemeId: scheme.id, workflowId, stepIndex, approver, comments } } as any),
    createEventEnvelope({ eventType: "WorkflowStepAdvanced", aggregateType: "workflow", aggregateId: workflowId, idempotencyKey: `workflow:${workflowId}:advanced:${nextIndex}:${approver}`, actor: approver, payload: { workflowId, definitionId: "scheme-approval", previousStepId: String(stepIndex), nextStepId: String(nextIndex), decision: "approve", actorRole: approver, stepIndex: nextIndex } }),
  ]
  await commitWithEvents(async () => { await saveSchemeRecord({ ...scheme, approvedBy: [...new Set([...scheme.approvedBy, approver])], status: nextIndex >= 5 ? "approved" : "under_review", workflowId, updatedAt: new Date().toISOString() }) }, events)
}

export async function rejectSchemeStep(workflowId: string, stepIndex: number, rejector: string, reason: string): Promise<void> {
  const workflow = await getWorkflowInstance(workflowId)
  if (!workflow) throw new Error(`Workflow not found: ${workflowId}`)
  const scheme = await getScheme(workflow.aggregateId)
  if (!scheme) throw new Error(`Scheme not found: ${workflow.aggregateId}`)
  const events: PlatformEvent[] = [
    createEventEnvelope({ eventType: "SchemeStepRejected" as any, aggregateType: "scheme", aggregateId: scheme.id, idempotencyKey: `scheme:${scheme.id}:step-rejected:${stepIndex}:${rejector}`, actor: rejector, payload: { schemeId: scheme.id, workflowId, stepIndex, rejector, reason } } as any),
    createEventEnvelope({ eventType: "WorkflowRejected", aggregateType: "workflow", aggregateId: workflowId, idempotencyKey: `workflow:${workflowId}:rejected:${stepIndex}:${rejector}`, actor: rejector, payload: { workflowId, definitionId: "scheme-approval", rejectedAtStepId: String(stepIndex), actorRole: rejector, reason } }),
  ]
  await commitWithEvents(async () => { await saveSchemeRecord({ ...scheme, status: "suspended", updatedAt: new Date().toISOString() }) }, events)
}
