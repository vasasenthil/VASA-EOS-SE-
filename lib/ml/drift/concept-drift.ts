import type { DriftSeverity, MLOutcome, MLPrediction } from "../types"
import { performanceDrift } from "./performance-drift"
export function conceptDrift(predictions: MLPrediction[], outcomes: MLOutcome[], baselineAccuracy:number, threshold=0.15): { magnitude:number; severity:DriftSeverity; threshold:number } { const p=performanceDrift(predictions,outcomes,baselineAccuracy,threshold); return { magnitude:p.degradation, severity:p.severity, threshold } }
