import type { WorkflowStepDefinition } from "./schema"

export type ApprovalDecision = "approve" | "reject"

export interface ApprovalActor {
  id: string
  roles: string[]
  jurisdictionId: string
  delegatedBy?: string
  delegationExpiresAt?: string
}

export interface RecordedApproval {
  actorId: string
  effectiveActorId: string
  decision: ApprovalDecision
  decidedAt: string
  comment?: string
}

export interface ApprovalContext {
  initiatorId: string
  jurisdictionId: string
  eligibleActorIds?: string[]
}

export interface ApprovalOutcome {
  state: "pending" | "approved" | "rejected"
  required: number
  approved: number
  rejected: number
  decisions: RecordedApproval[]
}

export class ApprovalPolicyError extends Error {
  readonly code: "INELIGIBLE_ROLE" | "WRONG_JURISDICTION" | "SEGREGATION_OF_DUTIES" | "DUPLICATE_ACTOR" | "EXPIRED_DELEGATION" | "ACTOR_NOT_ASSIGNED"

  constructor(code: ApprovalPolicyError["code"], message: string) {
    super(message)
    this.name = "ApprovalPolicyError"
    this.code = code
  }
}

function policyFor(step: WorkflowStepDefinition) {
  return step.approval ?? {
    mode: "any" as const,
    requiredApprovals: 1,
    eligibleRoles: [step.requiredRole],
    requireDistinctActors: true,
    requireSameJurisdiction: true,
    prohibitInitiator: true,
  }
}

function requiredCount(step: WorkflowStepDefinition, context: ApprovalContext): number {
  const policy = policyFor(step)
  if (policy.mode === "any") return 1
  if (policy.mode === "quorum") return policy.requiredApprovals ?? 1
  if (!context.eligibleActorIds?.length) throw new ApprovalPolicyError("ACTOR_NOT_ASSIGNED", "All-approver steps require an explicit eligible actor roster")
  return context.eligibleActorIds.length
}

export function recordApprovalDecision(input: {
  step: WorkflowStepDefinition
  context: ApprovalContext
  actor: ApprovalActor
  decision: ApprovalDecision
  previous?: RecordedApproval[]
  now?: string
  comment?: string
}): ApprovalOutcome {
  const { step, context, actor } = input
  const policy = policyFor(step)
  const now = input.now ?? new Date().toISOString()
  const effectiveActorId = actor.delegatedBy ?? actor.id
  const eligibleRoles = policy.eligibleRoles ?? [step.requiredRole]

  if (!actor.roles.some((role) => eligibleRoles.includes(role))) throw new ApprovalPolicyError("INELIGIBLE_ROLE", `Actor lacks one of the required roles: ${eligibleRoles.join(", ")}`)
  if (policy.requireSameJurisdiction && actor.jurisdictionId !== context.jurisdictionId) throw new ApprovalPolicyError("WRONG_JURISDICTION", "Actor is outside the workflow jurisdiction")
  if (policy.prohibitInitiator && (actor.id === context.initiatorId || effectiveActorId === context.initiatorId)) throw new ApprovalPolicyError("SEGREGATION_OF_DUTIES", "The workflow initiator cannot approve this step")
  if (actor.delegatedBy && (!actor.delegationExpiresAt || Date.parse(actor.delegationExpiresAt) < Date.parse(now))) throw new ApprovalPolicyError("EXPIRED_DELEGATION", "Approval delegation is missing or expired")
  if (context.eligibleActorIds?.length && !context.eligibleActorIds.includes(effectiveActorId)) throw new ApprovalPolicyError("ACTOR_NOT_ASSIGNED", "Actor is not assigned to this approval step")

  const decisions = [...(input.previous ?? [])]
  if (policy.requireDistinctActors && decisions.some((item) => item.actorId === actor.id || item.effectiveActorId === effectiveActorId)) throw new ApprovalPolicyError("DUPLICATE_ACTOR", "The same actor or delegator cannot approve twice")
  decisions.push({ actorId: actor.id, effectiveActorId, decision: input.decision, decidedAt: now, comment: input.comment })

  const required = requiredCount(step, context)
  const approved = decisions.filter((item) => item.decision === "approve").length
  const rejected = decisions.filter((item) => item.decision === "reject").length
  return { state: rejected > 0 ? "rejected" : approved >= required ? "approved" : "pending", required, approved, rejected, decisions }
}
