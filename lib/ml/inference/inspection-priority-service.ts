import { extractInspectionFeatures, type InspectionFeatureInput } from "../features/inspection-features"
import { runPrediction } from "./common"
export async function predictInspectionPriority(input: InspectionFeatureInput) { const p=await runPrediction("inspection-priority",extractInspectionFeatures(input)); return p ? { predictionId:p.id, urgent:Number(p.prediction), confidence:p.confidence, modelVersion:p.modelVersion } : undefined }
