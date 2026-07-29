import assert from "node:assert/strict"
import test from "node:test"
import { ApprovalPolicyError, recordApprovalDecision } from "@/lib/workflow-runtime/approvals"
import { workflowStepDefinitionSchema } from "@/lib/workflow-runtime/schema"

const step = workflowStepDefinitionSchema.parse({
  stepName: "District committee sanction",
  requiredRole: "DEO",
  slaDurationSeconds: 86400,
  approval: { mode: "quorum", requiredApprovals: 2, eligibleRoles: ["DEO", "CEO"] },
})
const context = { initiatorId: "principal-1", jurisdictionId: "district-33", eligibleActorIds: ["deo-1", "ceo-1", "deo-2"] }

test("quorum remains pending until distinct eligible actors approve", () => {
  const first = recordApprovalDecision({ step, context, actor: { id: "deo-1", roles: ["DEO"], jurisdictionId: "district-33" }, decision: "approve", now: "2026-07-29T00:00:00.000Z" })
  assert.equal(first.state, "pending")
  const second = recordApprovalDecision({ step, context, actor: { id: "ceo-1", roles: ["CEO"], jurisdictionId: "district-33" }, decision: "approve", previous: first.decisions, now: "2026-07-29T00:01:00.000Z" })
  assert.deepEqual({ state: second.state, required: second.required, approved: second.approved }, { state: "approved", required: 2, approved: 2 })
})

test("a rejection terminates a quorum decision", () => {
  const outcome = recordApprovalDecision({ step, context, actor: { id: "deo-2", roles: ["DEO"], jurisdictionId: "district-33" }, decision: "reject" })
  assert.equal(outcome.state, "rejected")
})

test("enforces jurisdiction, role, assignment, maker-checker and duplicate controls", () => {
  const cases = [
    [{ id: "deo-1", roles: ["DEO"], jurisdictionId: "district-2" }, "WRONG_JURISDICTION"],
    [{ id: "deo-1", roles: ["TEACHER"], jurisdictionId: "district-33" }, "INELIGIBLE_ROLE"],
    [{ id: "unknown", roles: ["DEO"], jurisdictionId: "district-33" }, "ACTOR_NOT_ASSIGNED"],
    [{ id: "principal-1", roles: ["DEO"], jurisdictionId: "district-33" }, "SEGREGATION_OF_DUTIES"],
  ] as const
  for (const [actor, code] of cases) assert.throws(() => recordApprovalDecision({ step, context, actor: { ...actor, roles: [...actor.roles] }, decision: "approve" }), (error) => error instanceof ApprovalPolicyError && error.code === code)
  const first = recordApprovalDecision({ step, context, actor: { id: "deo-1", roles: ["DEO"], jurisdictionId: "district-33" }, decision: "approve" })
  assert.throws(() => recordApprovalDecision({ step, context, actor: { id: "deo-1", roles: ["DEO"], jurisdictionId: "district-33" }, decision: "approve", previous: first.decisions }), (error) => error instanceof ApprovalPolicyError && error.code === "DUPLICATE_ACTOR")
})

test("accepts a live delegation but blocks expired delegation", () => {
  const delegatedContext = { ...context, eligibleActorIds: ["ceo-1"] }
  const live = recordApprovalDecision({ step, context: delegatedContext, actor: { id: "deputy-1", delegatedBy: "ceo-1", delegationExpiresAt: "2026-08-01T00:00:00.000Z", roles: ["CEO"], jurisdictionId: "district-33" }, decision: "approve", now: "2026-07-29T00:00:00.000Z" })
  assert.equal(live.decisions[0].effectiveActorId, "ceo-1")
  assert.throws(() => recordApprovalDecision({ step, context: delegatedContext, actor: { id: "deputy-1", delegatedBy: "ceo-1", delegationExpiresAt: "2026-07-01T00:00:00.000Z", roles: ["CEO"], jurisdictionId: "district-33" }, decision: "approve", now: "2026-07-29T00:00:00.000Z" }), (error) => error instanceof ApprovalPolicyError && error.code === "EXPIRED_DELEGATION")
})
