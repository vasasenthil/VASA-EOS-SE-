import { populationStabilityIndex } from "../drift/psi"
import { ksTest } from "../drift/ks-test"

export interface DriftInput { feature: string; baseline: number[]; current: number[]; psiThreshold?: number; ksThreshold?: number }
export interface DriftSignal { feature: string; psi: number; ks: number; drifted: boolean; reason: string }

export function detectProductionDrift(input: DriftInput): DriftSignal {
  const psiScore = populationStabilityIndex(input.baseline, input.current, { critical: input.psiThreshold })
  const ksScore = ksTest(input.baseline, input.current, input.ksThreshold)
  const psi = psiScore.magnitude
  const ks = ksScore.statistic
  const psiThreshold = input.psiThreshold ?? 0.2
  const ksThreshold = input.ksThreshold ?? 0.15
  const drifted = psi > psiThreshold || ks > ksThreshold
  return { feature: input.feature, psi, ks, drifted, reason: drifted ? "distribution drift exceeds PSI/KS threshold" : "within configured thresholds" }
}
