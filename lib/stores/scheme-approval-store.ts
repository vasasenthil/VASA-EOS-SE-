import { commitWithEvents } from "@/lib/events/outbox-publisher"
import { createEventEnvelope, type PlatformEvent } from "@/lib/events/schemas"
import { createWorkflowInstance, getWorkflowInstance, saveWorkflowInstance } from "@/lib/workflow-runtime/store"
import { nextRunnableStepIndex, workflowDefinitionFor } from "@/lib/workflow-runtime/schema"
import type { VasaSession } from "@/lib/auth/session"
import { getScheme, schemeWorkflowId, saveSchemeRecord } from "./scheme-store"
import "@/lib/schemes/workflow-definition"

function authorizeJurisdiction(jurisdiction: string | undefined, actor: VasaSession): void {
  if (!jurisdiction || actor.tenant.stateId !== jurisdiction) throw new Error("Scheme is outside your jurisdiction")
}

export async function proposeScheme(schemeId: string, actor: VasaSession): Promise<void> {
  const scheme = await getScheme(schemeId)
  if (!scheme) throw new Error("Scheme not found")
  authorizeJurisdiction(scheme.jurisdictionId, actor)
  if (!actor.roles.some(role => ["SECRETARY", "MINISTER", "CABINET"].includes(role))) throw new Error("Proposal role required")
  if (scheme.status !== "draft" && scheme.status !== "proposed") throw new Error("Scheme already submitted")
  const workflowId = schemeWorkflowId(scheme.id)
  const events: PlatformEvent[] = [createEventEnvelope({ eventType: "SchemeProposed", aggregateType: "scheme", aggregateId: scheme.id, idempotencyKey: `scheme:${scheme.id}:proposed:${workflowId}`, actor: actor.subject, payload: { schemeId, workflowId, proposedBy: actor.subject, status: "under_review" } } as any)]
  await commitWithEvents(async () => {
    await createWorkflowInstance({ id: workflowId, workflowType: "scheme-approval", aggregateId: scheme.id, payload: { context: { budget: scheme.budget, category: scheme.category, initiatorId: scheme.proposedBy, jurisdictionId: scheme.jurisdictionId!, submittedBy: actor.subject } } })
    await saveSchemeRecord({ ...scheme, status: "under_review", workflowId, updatedAt: new Date().toISOString() }, scheme)
  }, events)
}

async function decide(workflowId: string, expectedStep: number, actor: VasaSession, comment: string, decision: "approve" | "reject"): Promise<void> {
  if (!Number.isInteger(expectedStep) || expectedStep < 0) throw new Error("Expected step is required")
  if (typeof comment !== "string" || comment.length > 2000) throw new Error("Invalid decision comment")
  const workflow = await getWorkflowInstance(workflowId)
  if (!workflow || workflow.workflowType !== "scheme-approval") throw new Error("Scheme workflow not found")
  const scheme = await getScheme(workflow.aggregateId)
  if (!scheme || scheme.workflowId !== workflow.id) throw new Error("Scheme workflow mismatch")
  authorizeJurisdiction(scheme.jurisdictionId, actor)
  if (workflow.status !== "running" || scheme.status !== "under_review" || workflow.currentStepIndex !== expectedStep) throw new Error("Approval state changed; refresh before deciding")
  const definition = workflowDefinitionFor(workflow.workflowType)
  const step = definition.steps[workflow.currentStepIndex]
  if (!step || step.requiredRole === "SYSTEM" || !actor.roles.includes(step.requiredRole)) throw new Error("Current approval role required")
  if (!workflow.payload.context.initiatorId || workflow.payload.context.jurisdictionId !== scheme.jurisdictionId) throw new Error("Approval context is incomplete")
  if ([scheme.proposedBy, workflow.payload.context.initiatorId, workflow.payload.context.submittedBy].includes(actor.subject)) throw new Error("Initiator cannot approve their own proposal")
  if (scheme.approvedBy.includes(actor.subject)) throw new Error("Separate approver required for each step")
  const now = new Date().toISOString()
  const nextIndex = nextRunnableStepIndex(definition, expectedStep + 1, workflow.payload.context)
  const humanApprovalComplete = nextIndex >= 3
  const eventId = crypto.randomUUID()
  const payload = structuredClone(workflow.payload)
  payload.history.push({ stepIndex: expectedStep, stepName: step.stepName, completedAt: now, eventId, compensateAction: step.compensateAction })
  payload.approvals.push({ stepIndex: expectedStep, decisions: [{ actorId: actor.subject, effectiveActorId: actor.subject, decision, decidedAt: now, comment }] })
  const events: PlatformEvent[] = [createEventEnvelope({ id: eventId, eventType: decision === "approve" ? "SchemeStepApproved" : "SchemeStepRejected", aggregateType: "scheme", aggregateId: scheme.id, idempotencyKey: `scheme:${scheme.id}:decision:${expectedStep}`, actor: actor.subject, payload: { schemeId: scheme.id, workflowId, stepIndex: expectedStep, approver: actor.subject, rejector: actor.subject, comments: comment, reason: comment } } as any)]
  await commitWithEvents(async () => {
    await saveWorkflowInstance({ ...workflow, currentStepIndex: decision === "approve" ? nextIndex : expectedStep, status: decision === "approve" ? "running" : "rejected", currentStepStartedAt: now, payload })
    await saveSchemeRecord({ ...scheme, approvedBy: decision === "approve" ? [...scheme.approvedBy, actor.subject] : scheme.approvedBy, status: decision === "reject" ? "suspended" : humanApprovalComplete ? "approved" : "under_review", updatedAt: now }, scheme)
  }, events)
}
export async function approveSchemeStep(workflowId: string, stepIndex: number, actor: VasaSession, comments: string): Promise<void> { await decide(workflowId, stepIndex, actor, comments, "approve") }
export async function rejectSchemeStep(workflowId: string, stepIndex: number, actor: VasaSession, reason: string): Promise<void> { await decide(workflowId, stepIndex, actor, reason, "reject") }
