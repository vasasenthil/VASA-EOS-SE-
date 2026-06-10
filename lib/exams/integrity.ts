// VASA-EOS(SE) — examination integrity register ("a mark a child earns is a mark a child keeps").
//
// Board examinations decide a child's future; their credibility is a public trust. This maps
// each malpractice / fraud VECTOR across the exam lifecycle — paper leaks, predictable papers,
// impersonation, mass copying, OMR tampering, result tampering, certificate forgery, anchor
// tampering and marksheet-privacy breaches — to the in-repo control that closes it, tagged by
// the exam-pipeline STAGE it guards (pre-exam · in-hall · evaluation · results). Every
// controlRef is asserted to exist on disk (self-verifying); controls needing live infra at
// deploy (real KMS-encrypted distribution, live invigilation cameras) are honestly 'partial'.
// Pure + client-safe.

export type ExamIntegrityStatus = "enforced" | "partial"
export type ExamStage = "pre-exam" | "in-hall" | "evaluation" | "results"

export interface ExamIntegrityControl {
  id: string
  /** The malpractice / fraud vector being closed. */
  vector: string
  /** The exam-lifecycle stage this control guards. */
  stage: ExamStage
  /** The mechanism that prevents it. */
  control: string
  /** In-repo evidence path (asserted to exist on disk). */
  controlRef: string
  status: ExamIntegrityStatus
}

export const EXAM_INTEGRITY_CONTROLS: ExamIntegrityControl[] = [
  { id: "paper-leak", vector: "Question-paper leak before the exam", stage: "pre-exam", control: "AES-256 encrypted, time-locked distribution — paper opens only at exam time", controlRef: "lib/exams/index.ts", status: "partial" },
  { id: "predictable-papers", vector: "Predictable / recycled papers gameable by rote", stage: "pre-exam", control: "AI question-paper generation from a blueprint over a curated question bank", controlRef: "lib/question-bank/index.ts", status: "enforced" },
  { id: "impersonation", vector: "Candidate impersonation / proxy sitting the exam", stage: "in-hall", control: "Seat allocation binds roll number to candidate + photo for invigilator verification", controlRef: "lib/exam-seating/index.ts", status: "enforced" },
  { id: "mass-copying", vector: "Mass copying / collusion inside the hall", stage: "in-hall", control: "Dispersed seating plan + CCTV invigilation coverage register", controlRef: "lib/cctv/index.ts", status: "partial" },
  { id: "omr-tampering", vector: "OMR / answer-sheet substitution or tampering", stage: "evaluation", control: "On-device OMR scoring with per-sheet capture and audit", controlRef: "lib/omr/index.ts", status: "enforced" },
  { id: "result-tampering", vector: "Arbitrary or altered marks at result compilation", stage: "results", control: "Controlled result-publication workflow — moderation before publish, no silent edits", controlRef: "lib/results/index.ts", status: "enforced" },
  { id: "certificate-forgery", vector: "Forged or altered certificates / marksheets", stage: "results", control: "Soulbound verifiable credential — hash verification detects any field tampering", controlRef: "lib/credentials/index.ts", status: "enforced" },
  { id: "anchor-tampering", vector: "Back-dated / altered result records after publish", stage: "results", control: "Blockchain-anchored, hash-chained tamper-evident ledger over result events", controlRef: "lib/audit/trail.ts", status: "enforced" },
  { id: "marksheet-privacy", vector: "Marksheet / result PII exposed or misused", stage: "results", control: "Result PII classified sensitive and consent-gated on read", controlRef: "lib/consent/pii-catalogue.ts", status: "enforced" },
]

export function controlById(id: string): ExamIntegrityControl | undefined {
  return EXAM_INTEGRITY_CONTROLS.find((c) => c.id === id)
}

export function byStatus(status: ExamIntegrityStatus): ExamIntegrityControl[] {
  return EXAM_INTEGRITY_CONTROLS.filter((c) => c.status === status)
}

export function byStage(stage: ExamStage): ExamIntegrityControl[] {
  return EXAM_INTEGRITY_CONTROLS.filter((c) => c.stage === stage)
}

export interface ExamIntegritySummary {
  controls: number
  enforced: number
  partial: number
  /** Distinct exam-lifecycle stages guarded. */
  stagesCovered: number
}

export function examIntegritySummary(items: ExamIntegrityControl[] = EXAM_INTEGRITY_CONTROLS): ExamIntegritySummary {
  return {
    controls: items.length,
    enforced: items.filter((c) => c.status === "enforced").length,
    partial: items.filter((c) => c.status === "partial").length,
    stagesCovered: new Set(items.map((c) => c.stage)).size,
  }
}

function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(items: ExamIntegrityControl[] = EXAM_INTEGRITY_CONTROLS): string {
  const header = ["Vector", "Stage", "Control", "Component", "Status"]
  const rows = items.map((c) => [c.vector, c.stage, c.control, c.controlRef, c.status].map(csvField).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
