import { extractSchemeFeatures, type SchemeFeatureInput } from "../features/scheme-features"
import { runPrediction } from "./common"
export async function predictSchemeImpact(input: SchemeFeatureInput) { const p=await runPrediction("scheme-impact",extractSchemeFeatures(input)); return p ? { predictionId:p.id, effective:Number(p.prediction), confidence:p.confidence, modelVersion:p.modelVersion } : undefined }
