import type { NumericVector } from "../types"
export interface InspectionFeatureInput { infrastructureScore: number; teacherStudentRatio: number; pastInspectionScore: number; complianceFindings: number; safetyIncidents: number; attendancePct: number }
const clamp=(n:number,min=0,max=100)=>Math.min(max,Math.max(min,Number.isFinite(n)?n:0))
export function extractInspectionFeatures(input: InspectionFeatureInput): NumericVector { return { infrastructureScore: clamp(input.infrastructureScore)/100, teacherStudentRatio: Math.max(0,input.teacherStudentRatio)/80, pastInspectionScore: clamp(input.pastInspectionScore)/100, complianceFindings: Math.max(0,input.complianceFindings)/50, safetyIncidents: Math.max(0,input.safetyIncidents)/25, attendancePct: clamp(input.attendancePct)/100 } }
