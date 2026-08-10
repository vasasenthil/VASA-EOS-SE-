import { registerModel } from "../registry/register-model"
import type { MLModel } from "../types"
import { trainLogisticRegression, type TrainingExample } from "./logistic"
import { syntheticStudentTrainingData } from "./synthetic-data"
export async function trainDropoutRisk(data: TrainingExample[] = syntheticStudentTrainingData()): Promise<MLModel> { const started=Date.now(); const trained=trainLogisticRegression(data); return registerModel({modelType:"dropout-risk",version:`dropout-${trained.datasetHash.slice(0,12)}`,artifact:trained.artifact,metrics:trained.metrics,datasetHash:trained.datasetHash,durationSeconds:(Date.now()-started)/1000,status:"candidate",highStakes:true}) }
