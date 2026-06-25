// VASA-EOS(SE) — Examination Security & Evaluation (Flagship 05).
// End-to-end secure conduct for TN State Board (DGE) exams: blueprint → encrypted,
// time-locked distribution → smartphone OMR → AI-augmented + human evaluation →
// blockchain-anchored results → auto DigiLocker push.

export interface ExamPipelineStep {
  key: string
  label: string
  detail: string
}

export const EXAM_PIPELINE: ExamPipelineStep[] = [
  { key: "blueprint", label: "AI Question-Paper Generation", detail: "Generated from blueprint; reviewed by SME" },
  { key: "distribution", label: "Encrypted Distribution", detail: "AES-256, time-locked opening at exam time" },
  { key: "omr", label: "Smartphone OMR / ICR", detail: "Objective sections scanned on-device" },
  { key: "evaluation", label: "AI-Augmented Evaluation", detail: "Descriptive answers + mandatory human review" },
  { key: "anchor", label: "Blockchain-Anchored Results", detail: "Tamper-evident; CAG / international verification" },
  { key: "digilocker", label: "Auto DigiLocker Push", detail: "Marksheet pushed to APAAR-linked DigiLocker" },
]

export type ExamType = "SSLC" | "HSC"

export const EXAM_SUBJECTS: Record<ExamType, string[]> = {
  SSLC: ["Tamil", "English", "Mathematics", "Science", "Social Science"],
  HSC: ["Tamil", "English", "Subject 1", "Subject 2", "Subject 3", "Subject 4"],
}
