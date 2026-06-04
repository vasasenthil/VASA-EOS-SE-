// VASA-EOS(SE) — School Recognition Workflow (Sec 52).
// Lifecycle for recognition/renewal under the Tamil Nadu Recognised Private Schools
// (Regulation) Act 1973 & Rules 1974: a staged application pipeline with eligibility
// checks. Every transition is audit-logged. In-memory mock store for demo.

import { appendAudit } from "@/lib/audit/trail"

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

function appId(): string {
  return `REC-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
}

const store: RecognitionApplication[] = [
  {
    id: "REC-SEED1",
    school: "Bharathi Vidyalaya Matriculation",
    district: "Salem",
    type: "renewal",
    stageIndex: 2,
    status: "in_progress",
    criteriaMet: ["Trust/Society registration", "Land & building ownership/lease", "Qualified teachers (TET)"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "REC-SEED2",
    school: "Green Valley Public School",
    district: "Tiruppur",
    type: "new",
    stageIndex: 0,
    status: "in_progress",
    criteriaMet: ["Trust/Society registration"],
    updatedAt: new Date().toISOString(),
  },
]

export function listApplications(): RecognitionApplication[] {
  return [...store]
}

export function fileApplication(input: {
  school: string
  district: string
  type: "new" | "renewal"
}): RecognitionApplication {
  const a: RecognitionApplication = {
    id: appId(),
    school: input.school,
    district: input.district,
    type: input.type,
    stageIndex: 0,
    status: "in_progress",
    criteriaMet: [],
    updatedAt: new Date().toISOString(),
  }
  store.unshift(a)
  appendAudit({ actor: "applicant", action: "recognition.file", resource: a.id, details: { school: a.school, type: a.type } })
  return a
}

/** Advance to the next stage; final stage marks the school Recognised. */
export function advanceApplication(id: string): RecognitionApplication | undefined {
  const a = store.find((x) => x.id === id)
  if (!a || a.status !== "in_progress") return a
  if (a.stageIndex < RECOGNITION_STAGES.length - 1) {
    a.stageIndex += 1
    if (a.stageIndex === RECOGNITION_STAGES.length - 1) a.status = "recognised"
    a.updatedAt = new Date().toISOString()
    appendAudit({
      actor: "DEO",
      action: "recognition.advance",
      resource: id,
      details: { stage: RECOGNITION_STAGES[a.stageIndex] },
    })
  }
  return a
}

export function rejectApplication(id: string, reason: string): RecognitionApplication | undefined {
  const a = store.find((x) => x.id === id)
  if (!a) return undefined
  a.status = "rejected"
  a.updatedAt = new Date().toISOString()
  appendAudit({ actor: "DEO", action: "recognition.reject", resource: id, details: { reason } })
  return a
}

export interface RecognitionSummary {
  total: number
  inProgress: number
  recognised: number
  rejected: number
}

export function recognitionSummary(rows: RecognitionApplication[] = store): RecognitionSummary {
  return {
    total: rows.length,
    inProgress: rows.filter((r) => r.status === "in_progress").length,
    recognised: rows.filter((r) => r.status === "recognised").length,
    rejected: rows.filter((r) => r.status === "rejected").length,
  }
}
