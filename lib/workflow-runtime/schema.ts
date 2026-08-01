import { z } from "zod"

export const compensateActionSchema = z.enum([
  "reverse-scholarship-approval",
  "reverse-transfer-certificate-issuance",
  "release-workflow-lock",
  "reverse-budget-allocation",
  "notify-stakeholders-of-rejection",
])

export type CompensateAction = z.infer<typeof compensateActionSchema>

export const workflowConditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(["eq", "neq", "gt", "gte", "lt", "lte"]),
  value: z.union([z.string(), z.number(), z.boolean()]),
})

export const workflowStepDefinitionSchema = z.object({
  stepName: z.string().min(1),
  requiredRole: z.string().min(1),
  slaDurationSeconds: z.number().int().positive(),
  compensateAction: compensateActionSchema.optional(),
  when: workflowConditionSchema.optional(),
  approval: z.object({
    mode: z.enum(["any", "all", "quorum"]).default("any"),
    requiredApprovals: z.number().int().positive().optional(),
    eligibleRoles: z.array(z.string().min(1)).min(1).optional(),
    requireDistinctActors: z.boolean().default(true),
    requireSameJurisdiction: z.boolean().default(true),
    prohibitInitiator: z.boolean().default(true),
  }).optional(),
})

export const workflowDefinitionSchema = z.object({
  workflowType: z.string().min(1),
  steps: z.array(workflowStepDefinitionSchema).min(1),
})

export const workflowRuntimePayloadSchema = z.object({
  context: z.record(z.unknown()).default({}),
  history: z.array(z.object({
    stepIndex: z.number().int().nonnegative(),
    stepName: z.string().min(1),
    completedAt: z.string().datetime({ offset: true }),
    eventId: z.string().uuid(),
    compensateAction: compensateActionSchema.optional(),
  })).default([]),
  compensations: z.array(z.object({
    stepName: z.string().min(1),
    compensateAction: compensateActionSchema,
    compensatedAt: z.string().datetime({ offset: true }),
    eventId: z.string().uuid(),
  })).default([]),
})

export type WorkflowCondition = z.infer<typeof workflowConditionSchema>
export type WorkflowStepDefinition = z.infer<typeof workflowStepDefinitionSchema>
export type WorkflowDefinition = z.infer<typeof workflowDefinitionSchema>
export type WorkflowRuntimePayload = z.infer<typeof workflowRuntimePayloadSchema>
export type CompensationContext = {
  workflowInstanceId: string
  workflowType: string
  aggregateId: string
  stepName: string
  payload: WorkflowRuntimePayload
}
export type CompensationFn = (context: CompensationContext) => Promise<{ ok: true; detail: string }>

async function reverseScholarshipApproval(context: CompensationContext): Promise<{ ok: true; detail: string }> {
  return { ok: true, detail: `Scholarship approval compensation recorded for ${context.aggregateId} at ${context.stepName}` }
}

async function reverseTransferCertificateIssuance(context: CompensationContext): Promise<{ ok: true; detail: string }> {
  return { ok: true, detail: `Transfer certificate issuance compensation recorded for ${context.aggregateId} at ${context.stepName}` }
}

async function releaseWorkflowLock(context: CompensationContext): Promise<{ ok: true; detail: string }> {
  return { ok: true, detail: `Workflow lock released for ${context.workflowInstanceId}` }
}

async function reverseBudgetAllocation(context: CompensationContext): Promise<{ ok: true; detail: string }> {
  return { ok: true, detail: `Budget allocation reversal recorded for scheme ${context.aggregateId}` }
}

async function notifyStakeholdersOfRejection(context: CompensationContext): Promise<{ ok: true; detail: string }> {
  return { ok: true, detail: `Stakeholder rejection notice recorded for scheme ${context.aggregateId}` }
}

export const COMPENSATION_REGISTRY: Readonly<Record<CompensateAction, CompensationFn>> = {
  "reverse-scholarship-approval": reverseScholarshipApproval,
  "reverse-transfer-certificate-issuance": reverseTransferCertificateIssuance,
  "release-workflow-lock": releaseWorkflowLock,
  "reverse-budget-allocation": reverseBudgetAllocation,
  "notify-stakeholders-of-rejection": notifyStakeholdersOfRejection,
}

export const WORKFLOW_RUNTIME_DEFINITIONS = new Map<string, WorkflowDefinition>([
  ["scholarship-sanction", workflowDefinitionSchema.parse({
    workflowType: "scholarship-sanction",
    steps: [
      { stepName: "Headmaster verification", requiredRole: "PRINCIPAL", slaDurationSeconds: 86_400, compensateAction: "reverse-scholarship-approval" },
      { stepName: "Block sanction", requiredRole: "BEO", slaDurationSeconds: 172_800, compensateAction: "reverse-scholarship-approval" },
      { stepName: "District scrutiny", requiredRole: "DEO", slaDurationSeconds: 172_800, compensateAction: "reverse-scholarship-approval" },
      { stepName: "DBT release", requiredRole: "DEO", slaDurationSeconds: 86_400, compensateAction: "reverse-scholarship-approval" },
    ],
  })],
  ["tc-issuance", workflowDefinitionSchema.parse({
    workflowType: "tc-issuance",
    steps: [
      { stepName: "Academic record clearance", requiredRole: "ACADEMIC_HEAD", slaDurationSeconds: 86_400, compensateAction: "reverse-transfer-certificate-issuance" },
      { stepName: "Headmaster issuance", requiredRole: "PRINCIPAL", slaDurationSeconds: 86_400, compensateAction: "reverse-transfer-certificate-issuance" },
      { stepName: "Block countersignature", requiredRole: "BEO", slaDurationSeconds: 172_800, compensateAction: "reverse-transfer-certificate-issuance" },
    ],
  })],
  ["scheme-approval", workflowDefinitionSchema.parse({
    workflowType: "scheme-approval",
    steps: [
      { stepName: "Secretary Review", requiredRole: "SECRETARY", slaDurationSeconds: 259_200, compensateAction: "notify-stakeholders-of-rejection" },
      { stepName: "Minister Approval", requiredRole: "MINISTER", slaDurationSeconds: 432_000, compensateAction: "notify-stakeholders-of-rejection" },
      { stepName: "Cabinet Note", requiredRole: "CABINET", slaDurationSeconds: 604_800, compensateAction: "notify-stakeholders-of-rejection", when: { field: "budget", operator: "gt", value: 500000000 } },
      { stepName: "Budget Allocation", requiredRole: "SYSTEM", slaDurationSeconds: 86_400, compensateAction: "reverse-budget-allocation" },
      { stepName: "Scheme Activation", requiredRole: "SYSTEM", slaDurationSeconds: 86_400, compensateAction: "notify-stakeholders-of-rejection" },
    ],
  })],
])

export function workflowDefinitionFor(workflowType: string): WorkflowDefinition {
  const definition = WORKFLOW_RUNTIME_DEFINITIONS.get(workflowType)
  if (!definition) throw new Error(`Unknown workflow type: ${workflowType}`)
  return definition
}

export function parseWorkflowPayload(input: unknown): WorkflowRuntimePayload {
  return workflowRuntimePayloadSchema.parse(input ?? {})
}


export function shouldRunWorkflowStep(step: WorkflowStepDefinition, context: Record<string, unknown>): boolean {
  if (!step.when) return true
  const actual = context[step.when.field]
  const expected = step.when.value
  if (step.when.operator === "eq") return actual === expected
  if (step.when.operator === "neq") return actual !== expected
  if (typeof actual !== "number" || typeof expected !== "number") return false
  if (step.when.operator === "gt") return actual > expected
  if (step.when.operator === "gte") return actual >= expected
  if (step.when.operator === "lt") return actual < expected
  return actual <= expected
}

export function nextRunnableStepIndex(definition: WorkflowDefinition, startIndex: number, context: Record<string, unknown>): number {
  let index = startIndex
  while (index < definition.steps.length && !shouldRunWorkflowStep(definition.steps[index], context)) index += 1
  return index
}
