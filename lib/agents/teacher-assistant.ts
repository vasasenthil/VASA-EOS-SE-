// VASA-EOS(SE) — AI Teacher Assistant (Module Catalogue v3.0 — Platform / teacher-facing).
//
// Distinct from the org-wide agent catalogue (which lists the 8 governance agents), this is the teacher's own
// assistant: the concrete tasks it helps with — lesson-plan drafts, quiz generation, remediation suggestions,
// report-card comments, attendance summaries, resource finding — each with an autonomy level and a
// human-in-the-loop (HITL) gate. The rule is firm: anything that produces student-facing or record-affecting
// output is HITL — the teacher reviews and approves; only read-only summaries/retrieval run unattended. The
// teacher is the author, never the clerk. Pure + client-safe.

export type Autonomy = "suggest" | "draft" | "auto"

export interface AssistTask {
  key: string
  name: string
  description: string
  autonomy: Autonomy
  /** Whether a teacher must review/approve the output before it is used. */
  hitlRequired: boolean
  /** Model confidence for this task type (0–100). */
  confidence: number
  /** Whether the output is student-facing or affects a record. */
  highStakes: boolean
}

export const ASSIST_TASKS: AssistTask[] = [
  { key: "lesson-plan", name: "Lesson-plan draft", description: "Draft a lesson plan from the syllabus unit and learning outcomes", autonomy: "draft", hitlRequired: true, confidence: 82, highStakes: true },
  { key: "quiz-gen", name: "Quiz & question generation", description: "Generate practice questions from a blueprint", autonomy: "draft", hitlRequired: true, confidence: 88, highStakes: true },
  { key: "remediation", name: "Remediation suggestion", description: "Suggest targeted remediation from diagnostic gaps", autonomy: "suggest", hitlRequired: true, confidence: 79, highStakes: true },
  { key: "report-comments", name: "Report-card comment draft", description: "Draft holistic progress-card comments", autonomy: "draft", hitlRequired: true, confidence: 75, highStakes: true },
  { key: "doubt-answer", name: "Student doubt answering", description: "Draft an answer to a student doubt for the teacher to vet", autonomy: "suggest", hitlRequired: true, confidence: 80, highStakes: true },
  { key: "attendance-summary", name: "Attendance summary", description: "Summarise class attendance trends (read-only)", autonomy: "auto", hitlRequired: false, confidence: 95, highStakes: false },
  { key: "resource-find", name: "Teaching-resource finder", description: "Find DIKSHA/e-content resources for a topic (read-only)", autonomy: "auto", hitlRequired: false, confidence: 90, highStakes: false },
]

export function taskByKey(key: string): AssistTask | undefined {
  return ASSIST_TASKS.find((t) => t.key === key)
}

export function byAutonomy(autonomy: Autonomy): AssistTask[] {
  return ASSIST_TASKS.filter((t) => t.autonomy === autonomy)
}

export function hitlTasks(items: AssistTask[] = ASSIST_TASKS): AssistTask[] {
  return items.filter((t) => t.hitlRequired)
}

/** The safety invariant: every high-stakes task must be HITL-gated. */
export function invariantHolds(items: AssistTask[] = ASSIST_TASKS): boolean {
  return items.every((t) => !t.highStakes || t.hitlRequired)
}

export interface AssistantSummary {
  tasks: number
  hitlRequired: number
  autonomous: number
  highStakes: number
  /** Average confidence across tasks, 0–100. */
  avgConfidence: number
  invariantHolds: boolean
}

export function assistantSummary(items: AssistTask[] = ASSIST_TASKS): AssistantSummary {
  return {
    tasks: items.length,
    hitlRequired: items.filter((t) => t.hitlRequired).length,
    autonomous: items.filter((t) => !t.hitlRequired).length,
    highStakes: items.filter((t) => t.highStakes).length,
    avgConfidence: items.length === 0 ? 0 : Math.round(items.reduce((s, t) => s + t.confidence, 0) / items.length),
    invariantHolds: invariantHolds(items),
  }
}

function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(items: AssistTask[] = ASSIST_TASKS): string {
  const header = ["Task", "Autonomy", "HITL", "High-stakes", "Confidence"]
  const rows = items.map((t) => [t.name, t.autonomy, t.hitlRequired ? "required" : "no", t.highStakes ? "yes" : "no", String(t.confidence)].map(csvField).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
