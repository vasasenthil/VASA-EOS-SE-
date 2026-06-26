"use server"

import { integrations } from "@/lib/integrations"
import { appendAudit } from "@/lib/audit/trail"
import { EXAM_SUBJECTS, type ExamType } from "@/lib/exams"
import { can } from "@/lib/access/policy"
import { resolveSubject } from "@/lib/access/resolve"
import { policyGate } from "@/lib/policy-engine/server"

export interface ExamResultSubject {
  name: string
  marks: number
}

export interface ExamState {
  anchor?: string
  digiLockerUri?: string
  subjects?: ExamResultSubject[]
  total?: number
  max?: number
  error?: string
  mode?: "mock" | "live"
}

export async function processResultAction(_prev: ExamState, formData: FormData): Promise<ExamState> {
  const candidateApaar = ((formData.get("apaar") as string) || "").trim()
  const examType = ((formData.get("examType") as string) || "SSLC") as ExamType
  if (!candidateApaar) return { error: "Candidate APAAR is required." }

  // High-stakes: anchoring exam results + pushing marksheets is authority-only.
  const decision = can(await resolveSubject(), "process:exam", { type: "exam", id: candidateApaar })
  if (!decision.permitted) return { error: `Not allowed: ${decision.reason}` }

  // Policy-as-Code gate (RPwD Act 2016 §16/§31): deny-wins, audited — a CWSN candidate's assessment cannot be
  // conducted without the reasonable accommodation they are entitled to.
  const pwd = ((formData.get("pwd") as string) || "") === "on"
  const accommodation = ((formData.get("accommodation") as string) || "on") !== "off"
  const policy = await policyGate({ action: "assessment.conduct", resource: { pwd, accommodation } }, "exam-controller")
  if (policy.decision === "deny") {
    return { error: `Blocked by policy: ${policy.governing.map((rl) => rl.citation).join("; ")}` }
  }

  // In production these come from AI-augmented OMR + human-reviewed evaluation.
  const subjectNames = EXAM_SUBJECTS[examType] ?? EXAM_SUBJECTS.SSLC
  const subjects: ExamResultSubject[] = subjectNames.map((name) => ({
    name,
    marks: 55 + Math.floor(Math.random() * 45),
  }))
  const total = subjects.reduce((s, x) => s + x.marks, 0)
  const max = subjects.length * 100

  // Tamper-evident anchor of the result.
  const entry = await appendAudit({
    actor: "DGE-TN",
    action: "exam.result.anchor",
    resource: candidateApaar,
    details: { examType, total, max },
  })

  // Auto-push marksheet credential to DigiLocker.
  const push = await integrations.digilocker.pushCredential({
    apaarId: candidateApaar,
    type: examType === "HSC" ? "Class12" : "Class10",
    payloadUrl: `result://${candidateApaar}/${examType}`,
  })

  return {
    anchor: entry.hash,
    digiLockerUri: push.data?.uri,
    subjects,
    total,
    max,
    mode: push.mode,
  }
}
