// VASA-EOS(SE) — School Recognition Workflow (Sec 52) — client-safe core.
// Constants, types and pure helpers for recognition/renewal under the Tamil Nadu
// Recognised Private Schools (Regulation) Act 1973 & Rules 1974. The DB-backed
// persistence lives in ./store (server-only).

// Ordered stages of the statutory recognition pipeline.
export const RECOGNITION_STAGES = [
  "Application Received",
  "Document Verification",
  "Physical Inspection",
  "DEO Review",
  "Recognised",
] as const

export type RecognitionStage = (typeof RECOGNITION_STAGES)[number]

export type RecognitionStatus = "in_progress" | "recognised" | "rejected"

// Statutory eligibility conditions (TN 1973 Act / RTE norms).
export const ELIGIBILITY_CRITERIA = [
  "Trust/Society registration",
  "Land & building ownership/lease",
  "RTE infrastructure norms",
  "Qualified teachers (TET)",
  "Fire & building safety NOC",
  "Sanitation & drinking water",
] as const

export interface RecognitionApplication {
  id: string
  school: string
  district: string
  type: "new" | "renewal"
  stageIndex: number
  status: RecognitionStatus
  criteriaMet: string[] // subset of ELIGIBILITY_CRITERIA
  updatedAt: string
}

export interface RecognitionSummary {
  total: number
  inProgress: number
  recognised: number
  rejected: number
}

export function recognitionSummary(rows: RecognitionApplication[]): RecognitionSummary {
  return {
    total: rows.length,
    inProgress: rows.filter((r) => r.status === "in_progress").length,
    recognised: rows.filter((r) => r.status === "recognised").length,
    rejected: rows.filter((r) => r.status === "rejected").length,
  }
}
