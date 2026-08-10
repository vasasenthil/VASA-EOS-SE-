import { commitWithEvents } from "@/lib/events/outbox-publisher"
import { createEventEnvelope, type PlatformEvent } from "@/lib/events/schemas"
import { getActiveModel } from "../registry/get-active-model"
import { savePrediction } from "../store"
import type { MLModelType, MLPrediction, NumericVector } from "../types"
import { predictWithArtifact } from "../training/logistic"
export async function runPrediction(modelType: MLModelType, features: NumericVector): Promise<MLPrediction | undefined> { const model=await getActiveModel(modelType); if(!model) return undefined; const out=predictWithArtifact(model.artifact,features); const now=new Date().toISOString(); const prediction:MLPrediction={id:crypto.randomUUID(),modelId:model.id,modelType,modelVersion:model.version,inputFeatures:features,prediction:out.label,confidence:out.label===1?out.score:1-out.score,createdAt:now}; const events:PlatformEvent[]=[createEventEnvelope({eventType:"PredictionMade",aggregateType:"ml",aggregateId:model.id,idempotencyKey:`ml:${prediction.id}:prediction-made`,payload:{predictionId:prediction.id,modelType,modelVersion:model.version,inputFeatures:features,prediction:prediction.prediction,confidence:prediction.confidence,timestamp:now}} as any)]; return commitWithEvents(async()=>savePrediction(prediction),events) }
