import { z } from "zod"

export const mlModelTypeSchema = z.enum(["dropout-risk", "inspection-priority", "scheme-impact"])
export const mlModelStatusSchema = z.enum(["training", "candidate", "active", "deprecated", "rolled_back"])
export const driftTypeSchema = z.enum(["data", "concept", "performance"])
export const driftSeveritySchema = z.enum(["none", "warning", "critical"])
export const numericVectorSchema = z.record(z.number().finite())
export const metricsSchema = z.object({ accuracy: z.number().min(0).max(1), precision: z.number().min(0).max(1), recall: z.number().min(0).max(1), f1: z.number().min(0).max(1), loss: z.number().nonnegative().optional() }).passthrough()
export const modelArtifactSchema = z.object({ weights: numericVectorSchema, bias: z.number().finite(), features: z.array(z.string().min(1)), threshold: z.number().min(0).max(1).default(0.5), baseline: z.record(z.array(z.number())).default({}) })
export const mlModelSchema = z.object({ id: z.string().uuid(), modelType: mlModelTypeSchema, version: z.string().min(1), status: mlModelStatusSchema, metrics: metricsSchema, artifact: modelArtifactSchema, datasetHash: z.string().min(1), createdAt: z.string().datetime({ offset: true }), promotedAt: z.string().datetime({ offset: true }).optional(), highStakes: z.boolean().default(false) })
export const mlPredictionSchema = z.object({ id: z.string().uuid(), modelId: z.string().uuid(), modelType: mlModelTypeSchema, modelVersion: z.string().min(1), inputFeatures: numericVectorSchema, prediction: z.union([z.number(), z.string(), z.boolean()]), confidence: z.number().min(0).max(1), createdAt: z.string().datetime({ offset: true }) })
export const mlOutcomeSchema = z.object({ id: z.string().uuid(), predictionId: z.string().uuid(), actualOutcome: z.union([z.number(), z.string(), z.boolean()]), groundTruthSource: z.string().min(1), observedAt: z.string().datetime({ offset: true }) })
export const mlDriftReportSchema = z.object({ id: z.string().uuid(), modelId: z.string().uuid(), modelType: mlModelTypeSchema, modelVersion: z.string().min(1), driftType: driftTypeSchema, magnitude: z.number().nonnegative(), threshold: z.number().positive(), severity: driftSeveritySchema, detectedAt: z.string().datetime({ offset: true }) })
export const mlTrainingRunSchema = z.object({ id: z.string().uuid(), modelType: mlModelTypeSchema, version: z.string().min(1), metrics: metricsSchema, datasetHash: z.string().min(1), durationSeconds: z.number().nonnegative(), createdAt: z.string().datetime({ offset: true }) })
export const mlFeatureSnapshotSchema = z.object({ id: z.string().uuid(), modelType: mlModelTypeSchema, datasetHash: z.string().min(1), featureDistributions: z.record(z.array(z.number())).default({}), createdAt: z.string().datetime({ offset: true }) })
export const mlModelPromotionRequestSchema = z.object({
  version: z.string().trim().min(1).max(128),
  approvalReason: z.string().trim().min(10).max(2_000),
}).strict()
export const mlModelRollbackRequestSchema = z.object({
  rollbackReason: z.string().trim().min(10).max(2_000),
}).strict()
export type MLModelType = z.infer<typeof mlModelTypeSchema>
export type MLModelStatus = z.infer<typeof mlModelStatusSchema>
export type DriftType = z.infer<typeof driftTypeSchema>
export type DriftSeverity = z.infer<typeof driftSeveritySchema>
export type NumericVector = z.infer<typeof numericVectorSchema>
export type Metrics = z.infer<typeof metricsSchema>
export type ModelArtifact = z.infer<typeof modelArtifactSchema>
export type MLModel = z.infer<typeof mlModelSchema>
export type MLPrediction = z.infer<typeof mlPredictionSchema>
export type MLOutcome = z.infer<typeof mlOutcomeSchema>
export type MLDriftReport = z.infer<typeof mlDriftReportSchema>
export type MLTrainingRun = z.infer<typeof mlTrainingRunSchema>
export type MLFeatureSnapshot = z.infer<typeof mlFeatureSnapshotSchema>
export type MLModelPromotionRequest = z.infer<typeof mlModelPromotionRequestSchema>
export type MLModelRollbackRequest = z.infer<typeof mlModelRollbackRequestSchema>
