import { registerModel } from "../registry/register-model"
import type { MLModel } from "../types"
import { trainLogisticRegression, type TrainingExample } from "./logistic"
import { syntheticSchemeTrainingData } from "./synthetic-data"
export async function trainSchemeImpact(data: TrainingExample[] = syntheticSchemeTrainingData()): Promise<MLModel> { const started=Date.now(); const trained=trainLogisticRegression(data); return registerModel({modelType:"scheme-impact",version:`scheme-${trained.datasetHash.slice(0,12)}`,artifact:trained.artifact,metrics:trained.metrics,datasetHash:trained.datasetHash,durationSeconds:(Date.now()-started)/1000,status:"candidate",highStakes:false}) }
