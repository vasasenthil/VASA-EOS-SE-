import { z } from "zod"
import { driftTypeSchema, metricsSchema, mlModelTypeSchema, numericVectorSchema } from "./types"

const isoDateTime = z.string().datetime({ offset: true })
const uuid = z.string().uuid()
const nonEmpty = z.string().min(1)
const baseMLEvent = z.object({ id: uuid, aggregateType: z.literal("ml"), aggregateId: nonEmpty, occurredAt: isoDateTime, idempotencyKey: nonEmpty, causationId: uuid.optional(), correlationId: uuid.optional(), actor: nonEmpty.optional() })
export const predictionMadeSchema = baseMLEvent.extend({ eventType: z.literal("PredictionMade"), payload: z.object({ predictionId: uuid, modelType: mlModelTypeSchema, modelVersion: nonEmpty, inputFeatures: numericVectorSchema, prediction: z.union([z.number(), z.string(), z.boolean()]), confidence: z.number().min(0).max(1), timestamp: isoDateTime }) })
export const outcomeObservedSchema = baseMLEvent.extend({ eventType: z.literal("OutcomeObserved"), payload: z.object({ predictionId: uuid, actualOutcome: z.union([z.number(), z.string(), z.boolean()]), groundTruthSource: nonEmpty, observedAt: isoDateTime }) })
export const driftDetectedSchema = baseMLEvent.extend({ eventType: z.literal("DriftDetected"), payload: z.object({ modelType: mlModelTypeSchema, modelVersion: nonEmpty, driftType: driftTypeSchema, driftMagnitude: z.number().nonnegative(), thresholdBreached: z.number().positive(), severity: z.enum(["none", "warning", "critical"]) }) })
export const retrainingTriggeredSchema = baseMLEvent.extend({ eventType: z.literal("RetrainingTriggered"), payload: z.object({ modelType: mlModelTypeSchema, reason: nonEmpty, datasetSnapshotId: nonEmpty }) })
export const modelTrainedSchema = baseMLEvent.extend({ eventType: z.literal("ModelTrained"), payload: z.object({ modelType: mlModelTypeSchema, modelVersion: nonEmpty, metrics: metricsSchema, trainingDurationSeconds: z.number().nonnegative(), datasetHash: nonEmpty }) })
export const modelPromotedSchema = baseMLEvent.extend({ eventType: z.literal("ModelPromoted"), payload: z.object({ modelType: mlModelTypeSchema, modelVersion: nonEmpty, promotedBy: nonEmpty, approvalReason: nonEmpty }) })
export const modelRolledBackSchema = baseMLEvent.extend({ eventType: z.literal("ModelRolledBack"), payload: z.object({ modelType: mlModelTypeSchema, modelVersion: nonEmpty, rollbackReason: nonEmpty, previousVersion: nonEmpty }) })
export const mlEventSchemas = [predictionMadeSchema, outcomeObservedSchema, driftDetectedSchema, retrainingTriggeredSchema, modelTrainedSchema, modelPromotedSchema, modelRolledBackSchema] as const
export type PredictionMade = z.infer<typeof predictionMadeSchema>
export type OutcomeObserved = z.infer<typeof outcomeObservedSchema>
export type DriftDetected = z.infer<typeof driftDetectedSchema>
export type RetrainingTriggered = z.infer<typeof retrainingTriggeredSchema>
export type ModelTrained = z.infer<typeof modelTrainedSchema>
export type ModelPromoted = z.infer<typeof modelPromotedSchema>
export type ModelRolledBack = z.infer<typeof modelRolledBackSchema>
