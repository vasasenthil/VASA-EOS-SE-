import { extractStudentFeatures, type StudentFeatureInput } from "../features/student-features"
import { runPrediction } from "./common"
export async function predictDropoutRisk(input: StudentFeatureInput) { const p=await runPrediction("dropout-risk",extractStudentFeatures(input)); return p ? { predictionId:p.id, risk:Number(p.prediction), confidence:p.confidence, modelVersion:p.modelVersion } : undefined }
