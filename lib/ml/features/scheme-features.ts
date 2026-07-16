import type { NumericVector } from "../types"
export interface SchemeFeatureInput { budgetUtilizationPct: number; beneficiaryCount: number; targetPopulation: number; districtsCovered: number; equityIndex: number; priorOutcomeScore: number }
const clamp=(n:number,min=0,max=100)=>Math.min(max,Math.max(min,Number.isFinite(n)?n:0))
export function extractSchemeFeatures(input: SchemeFeatureInput): NumericVector { return { budgetUtilizationPct: clamp(input.budgetUtilizationPct)/100, beneficiaryCoverage: Math.max(0,input.beneficiaryCount)/Math.max(1,input.targetPopulation), districtsCovered: Math.max(0,input.districtsCovered)/38, equityIndex: clamp(input.equityIndex)/100, priorOutcomeScore: clamp(input.priorOutcomeScore)/100 } }
