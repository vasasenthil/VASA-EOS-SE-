import { createEventEnvelope, type PlatformEvent } from "@/lib/events/schemas"
import { commitWithEvents } from "@/lib/events/outbox-publisher"
import { recordApprovalDecision, type ApprovalActor, type ApprovalDecision } from "./approvals"
import { workflowDefinitionFor } from "./schema"
import { getWorkflowInstance, saveWorkflowInstance } from "./store"

export class WorkflowDecisionError extends Error {
  readonly code: "NOT_FOUND" | "NOT_RUNNING" | "STEP_MISMATCH" | "INVALID_CONTEXT"
  constructor(code: WorkflowDecisionError["code"], message: string) {
    super(message)
    this.name = "WorkflowDecisionError"
    this.code = code
  }
}

function stringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : undefined
}

export async function decideWorkflowStep(input: {
  workflowId: string
  expectedStepIndex: number
  actor: ApprovalActor
  decision: ApprovalDecision
  comment?: string
  now?: string
}): Promise<{ state: "pending" | "approved" | "rejected"; workflowId: string; stepIndex: number; approved: number; required: number }> {
  const instance = await getWorkflowInstance(input.workflowId)
  if (!instance) throw new WorkflowDecisionError("NOT_FOUND", "Workflow instance not found")
  if (instance.status !== "running") throw new WorkflowDecisionError("NOT_RUNNING", "Workflow instance is not running")
  if (instance.currentStepIndex !== input.expectedStepIndex) throw new WorkflowDecisionError("STEP_MISMATCH", "Workflow step changed; refresh before deciding")

  const definition = workflowDefinitionFor(instance.workflowType)
  const step = definition.steps[instance.currentStepIndex]
  if (!step) throw new WorkflowDecisionError("STEP_MISMATCH", "Workflow has no current approval step")
  const initiatorId = instance.payload.context.initiatorId
  const jurisdictionId = instance.payload.context.jurisdictionId
  if (typeof initiatorId !== "string" || typeof jurisdictionId !== "string") throw new WorkflowDecisionError("INVALID_CONTEXT", "Workflow approval context requires initiatorId and jurisdictionId")

  const round = instance.payload.approvals.find((item) => item.stepIndex === instance.currentStepIndex)
  const outcome = recordApprovalDecision({
    step,
    context: { initiatorId, jurisdictionId, eligibleActorIds: stringArray(instance.payload.context.eligibleActorIds) },
    actor: input.actor,
    decision: input.decision,
    previous: round?.decisions,
    now: input.now,
    comment: input.comment,
  })
  const nextApprovals = instance.payload.approvals.filter((item) => item.stepIndex !== instance.currentStepIndex)
  nextApprovals.push({ stepIndex: instance.currentStepIndex, decisions: outcome.decisions })
  const events: PlatformEvent[] = []
  if (outcome.state === "approved") {
    events.push(createEventEnvelope({
      eventType: "WorkflowStepAdvanced", aggregateType: "workflow", aggregateId: instance.id,
      idempotencyKey: `workflow-decision:${instance.id}:${instance.currentStepIndex}:approved`, actor: input.actor.id,
      payload: { workflowId: instance.id, definitionId: instance.workflowType, previousStepId: step.stepName, nextStepId: definition.steps[instance.currentStepIndex + 1]?.stepName, decision: "approve", actorRole: input.actor.roles[0] ?? step.requiredRole, stepIndex: instance.currentStepIndex + 1 },
    }))
  } else if (outcome.state === "rejected") {
    events.push(createEventEnvelope({
      eventType: "WorkflowRejected", aggregateType: "workflow", aggregateId: instance.id,
      idempotencyKey: `workflow-decision:${instance.id}:${instance.currentStepIndex}:rejected`, actor: input.actor.id,
      payload: { workflowId: instance.id, definitionId: instance.workflowType, rejectedAtStepId: step.stepName, actorRole: input.actor.roles[0] ?? step.requiredRole, reason: input.comment },
    }))
  }
  await commitWithEvents(async () => saveWorkflowInstance({ ...instance, payload: { ...instance.payload, approvals: nextApprovals } }), events)
  return { state: outcome.state, workflowId: instance.id, stepIndex: instance.currentStepIndex, approved: outcome.approved, required: outcome.required }
}
