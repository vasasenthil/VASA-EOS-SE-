import { z } from "zod"
import { predictionMadeSchema, outcomeObservedSchema, driftDetectedSchema, retrainingTriggeredSchema, modelTrainedSchema, modelPromotedSchema, modelRolledBackSchema } from "@/lib/ml/events"

const isoDateTime = z.string().datetime({ offset: true })
const uuid = z.string().uuid()
const nonEmpty = z.string().min(1)
const JsonValue: z.ZodType<unknown> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(JsonValue), z.record(JsonValue)]),
)

const baseEvent = z.object({
  id: uuid,
  aggregateType: nonEmpty,
  aggregateId: nonEmpty,
  occurredAt: isoDateTime,
  idempotencyKey: nonEmpty,
  causationId: uuid.optional(),
  correlationId: uuid.optional(),
  actor: nonEmpty.optional(),
})

export const workflowInstanceCreatedSchema = baseEvent.extend({
  eventType: z.literal("WorkflowInstanceCreated"),
  aggregateType: z.literal("workflow"),
  payload: z.object({
    workflowId: nonEmpty,
    definitionId: nonEmpty,
    context: z.record(JsonValue).default({}),
    status: z.literal("in_progress"),
  }),
})

export const workflowStepAdvancedSchema = baseEvent.extend({
  eventType: z.literal("WorkflowStepAdvanced"),
  aggregateType: z.literal("workflow"),
  payload: z.object({
    workflowId: nonEmpty,
    definitionId: nonEmpty,
    previousStepId: nonEmpty,
    nextStepId: nonEmpty.optional(),
    decision: z.literal("approve"),
    actorRole: nonEmpty,
    stepIndex: z.number().int().nonnegative(),
  }),
})

export const workflowCompletedSchema = baseEvent.extend({
  eventType: z.literal("WorkflowCompleted"),
  aggregateType: z.literal("workflow"),
  payload: z.object({
    workflowId: nonEmpty,
    definitionId: nonEmpty,
    finalStepId: nonEmpty.optional(),
    decision: z.union([z.literal("approve"), z.literal("resolve")]),
    actorRole: nonEmpty,
  }),
})

export const workflowRejectedSchema = baseEvent.extend({
  eventType: z.literal("WorkflowRejected"),
  aggregateType: z.literal("workflow"),
  payload: z.object({
    workflowId: nonEmpty,
    definitionId: nonEmpty,
    rejectedAtStepId: nonEmpty,
    actorRole: nonEmpty,
    reason: z.string().optional(),
  }),
})


export const workflowStepTimedOutSchema = baseEvent.extend({
  eventType: z.literal("WorkflowStepTimedOut"),
  aggregateType: z.literal("workflow"),
  payload: z.object({
    workflowId: nonEmpty,
    definitionId: nonEmpty,
    timedOutStepId: nonEmpty.optional(),
    stepIndex: z.number().int().nonnegative(),
    slaDurationSeconds: z.number().int().positive(),
    timedOutAt: isoDateTime,
  }),
})

export const compensationExecutedSchema = baseEvent.extend({
  eventType: z.literal("CompensationExecuted"),
  aggregateType: z.literal("workflow"),
  payload: z.object({
    workflowId: nonEmpty,
    definitionId: nonEmpty,
    compensatedStepName: nonEmpty,
    compensateAction: nonEmpty,
    detail: nonEmpty,
  }),
})

export const scholarshipFiledSchema = baseEvent.extend({
  eventType: z.literal("ScholarshipFiled"),
  aggregateType: z.literal("scholarship"),
  payload: z.object({
    scholarshipId: nonEmpty,
    workflowId: nonEmpty,
    student: nonEmpty,
    scheme: nonEmpty,
    amount: z.number().nonnegative(),
    tenantId: nonEmpty,
  }),
})

export const scholarshipSanctionedSchema = baseEvent.extend({
  eventType: z.literal("ScholarshipSanctioned"),
  aggregateType: z.literal("scholarship"),
  payload: z.object({
    scholarshipId: nonEmpty,
    workflowId: nonEmpty,
    scheme: nonEmpty,
    amount: z.number().nonnegative(),
    sanctionedBy: nonEmpty,
    finalStatus: z.union([z.literal("approved"), z.literal("in_progress")]),
  }),
})

export const transferCertificateFiledSchema = baseEvent.extend({
  eventType: z.literal("TransferCertificateFiled"),
  aggregateType: z.literal("transfer_certificate"),
  payload: z.object({
    tcId: nonEmpty,
    workflowId: nonEmpty,
    student: nonEmpty,
    needsCountersign: z.boolean(),
  }),
})

export const transferCertificateIssuedSchema = baseEvent.extend({
  eventType: z.literal("TransferCertificateIssued"),
  aggregateType: z.literal("transfer_certificate"),
  payload: z.object({
    tcId: nonEmpty,
    workflowId: nonEmpty,
    issuedBy: nonEmpty,
    finalStatus: z.literal("approved"),
  }),
})

const schemeEventPayload = z.record(JsonValue).and(z.object({ schemeId: nonEmpty }))

export const schemeProposedSchema = baseEvent.extend({ eventType: z.literal("SchemeProposed"), aggregateType: z.literal("scheme"), payload: schemeEventPayload })
export const schemeApprovedSchema = baseEvent.extend({ eventType: z.literal("SchemeApproved"), aggregateType: z.literal("scheme"), payload: schemeEventPayload })
export const schemeActivatedSchema = baseEvent.extend({ eventType: z.literal("SchemeActivated"), aggregateType: z.literal("scheme"), payload: schemeEventPayload })
export const schemeSuspendedSchema = baseEvent.extend({ eventType: z.literal("SchemeSuspended"), aggregateType: z.literal("scheme"), payload: schemeEventPayload })
export const schemeClosedSchema = baseEvent.extend({ eventType: z.literal("SchemeClosed"), aggregateType: z.literal("scheme"), payload: schemeEventPayload })
export const schemeBudgetUpdatedSchema = baseEvent.extend({ eventType: z.literal("SchemeBudgetUpdated"), aggregateType: z.literal("scheme"), payload: schemeEventPayload })
export const schemeOutcomeRecordedSchema = baseEvent.extend({ eventType: z.literal("SchemeOutcomeRecorded"), aggregateType: z.literal("scheme"), payload: schemeEventPayload })
export const schemeStepApprovedSchema = baseEvent.extend({ eventType: z.literal("SchemeStepApproved"), aggregateType: z.literal("scheme"), payload: schemeEventPayload })
export const schemeStepRejectedSchema = baseEvent.extend({ eventType: z.literal("SchemeStepRejected"), aggregateType: z.literal("scheme"), payload: schemeEventPayload })
export const budgetAllocatedSchema = baseEvent.extend({ eventType: z.literal("BudgetAllocated"), aggregateType: z.literal("scheme"), payload: schemeEventPayload })
export const fundsReleasedSchema = baseEvent.extend({ eventType: z.literal("FundsReleased"), aggregateType: z.literal("scheme"), payload: schemeEventPayload })
export const fundsUtilizedSchema = baseEvent.extend({ eventType: z.literal("FundsUtilized"), aggregateType: z.literal("scheme"), payload: schemeEventPayload })
export const beneficiaryAddedSchema = baseEvent.extend({ eventType: z.literal("BeneficiaryAdded"), aggregateType: z.literal("scheme"), payload: schemeEventPayload })
export const outcomeRecordedSchema = baseEvent.extend({ eventType: z.literal("OutcomeRecorded"), aggregateType: z.literal("scheme"), payload: schemeEventPayload })

export const platformEventSchema = z.discriminatedUnion("eventType", [
  workflowInstanceCreatedSchema,
  workflowStepAdvancedSchema,
  workflowCompletedSchema,
  workflowRejectedSchema,
  workflowStepTimedOutSchema,
  compensationExecutedSchema,
  scholarshipFiledSchema,
  scholarshipSanctionedSchema,
  transferCertificateFiledSchema,
  transferCertificateIssuedSchema,
  schemeProposedSchema,
  schemeApprovedSchema,
  schemeActivatedSchema,
  schemeSuspendedSchema,
  schemeClosedSchema,
  schemeBudgetUpdatedSchema,
  schemeOutcomeRecordedSchema,
  schemeStepApprovedSchema,
  schemeStepRejectedSchema,
  budgetAllocatedSchema,
  fundsReleasedSchema,
  fundsUtilizedSchema,
  beneficiaryAddedSchema,
  outcomeRecordedSchema,
  predictionMadeSchema,
  outcomeObservedSchema,
  driftDetectedSchema,
  retrainingTriggeredSchema,
  modelTrainedSchema,
  modelPromotedSchema,
  modelRolledBackSchema,
])

export type WorkflowInstanceCreated = z.infer<typeof workflowInstanceCreatedSchema>
export type WorkflowStepAdvanced = z.infer<typeof workflowStepAdvancedSchema>
export type WorkflowCompleted = z.infer<typeof workflowCompletedSchema>
export type WorkflowRejected = z.infer<typeof workflowRejectedSchema>
export type WorkflowStepTimedOut = z.infer<typeof workflowStepTimedOutSchema>
export type CompensationExecuted = z.infer<typeof compensationExecutedSchema>
export type ScholarshipFiled = z.infer<typeof scholarshipFiledSchema>
export type ScholarshipSanctioned = z.infer<typeof scholarshipSanctionedSchema>
export type TransferCertificateFiled = z.infer<typeof transferCertificateFiledSchema>
export type TransferCertificateIssued = z.infer<typeof transferCertificateIssuedSchema>
export type SchemeProposed = z.infer<typeof schemeProposedSchema>
export type SchemeApproved = z.infer<typeof schemeApprovedSchema>
export type SchemeActivated = z.infer<typeof schemeActivatedSchema>
export type SchemeSuspended = z.infer<typeof schemeSuspendedSchema>
export type SchemeClosed = z.infer<typeof schemeClosedSchema>
export type SchemeBudgetUpdated = z.infer<typeof schemeBudgetUpdatedSchema>
export type SchemeOutcomeRecorded = z.infer<typeof schemeOutcomeRecordedSchema>
export type SchemeStepApproved = z.infer<typeof schemeStepApprovedSchema>
export type SchemeStepRejected = z.infer<typeof schemeStepRejectedSchema>
export type BudgetAllocated = z.infer<typeof budgetAllocatedSchema>
export type FundsReleased = z.infer<typeof fundsReleasedSchema>
export type FundsUtilized = z.infer<typeof fundsUtilizedSchema>
export type BeneficiaryAdded = z.infer<typeof beneficiaryAddedSchema>
export type OutcomeRecorded = z.infer<typeof outcomeRecordedSchema>
export type PredictionMade = z.infer<typeof predictionMadeSchema>
export type OutcomeObserved = z.infer<typeof outcomeObservedSchema>
export type DriftDetected = z.infer<typeof driftDetectedSchema>
export type RetrainingTriggered = z.infer<typeof retrainingTriggeredSchema>
export type ModelTrained = z.infer<typeof modelTrainedSchema>
export type ModelPromoted = z.infer<typeof modelPromotedSchema>
export type ModelRolledBack = z.infer<typeof modelRolledBackSchema>
export type PlatformEvent = z.infer<typeof platformEventSchema>
export type PlatformEventType = PlatformEvent["eventType"]

export function parsePlatformEvent(input: unknown): PlatformEvent {
  return platformEventSchema.parse(input)
}

export function createEventId(): string {
  return crypto.randomUUID()
}

export function createEventEnvelope<T extends PlatformEvent>(event: Omit<T, "id" | "occurredAt"> & { id?: string; occurredAt?: string }): T {
  return parsePlatformEvent({
    ...event,
    id: event.id ?? createEventId(),
    occurredAt: event.occurredAt ?? new Date().toISOString(),
  }) as T
}
