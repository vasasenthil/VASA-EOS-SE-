import { csvField } from "@/lib/csv"
import { AI_REGISTER, aiRegisterSummary, type AiRegisterEntry } from "@/lib/ai/register"

export type BiasAuditFindingStatus = "pass" | "watch" | "action-required"

export interface BiasAuditFinding {
  id: string
  moduleId: "57.4" | "71.2"
  registerEntryId: string
  protectedConstituency: string
  risk: AiRegisterEntry["risk"]
  status: BiasAuditFindingStatus
  evidence: string
  requiredAction: string
}

export interface BiasAuditReport {
  reportId: string
  period: string
  generatedAt: string
  findings: BiasAuditFinding[]
  summary: {
    total: number
    pass: number
    watch: number
    actionRequired: number
    highRiskHumanReviewed: number
  }
}

export interface AnnualAiTransparencyReport {
  reportId: string
  moduleId: "71.3"
  year: number
  generatedAt: string
  registerSummary: ReturnType<typeof aiRegisterSummary>
  biasAuditSummary: BiasAuditReport["summary"]
  publicAssurance: string[]
}

function statusFor(entry: AiRegisterEntry): BiasAuditFindingStatus {
  if (entry.risk === "high" && entry.status !== "human-review-required") return "action-required"
  if (entry.risk === "high") return "watch"
  return "pass"
}

export function generateQuarterlyBiasAuditReport(input: { period: string; generatedAt?: string; entries?: AiRegisterEntry[] }): BiasAuditReport {
  const entries = input.entries ?? AI_REGISTER
  const findings = entries.map((entry): BiasAuditFinding => {
    const status = statusFor(entry)
    return {
      id: `bias-${input.period}-${entry.id}`,
      moduleId: entry.kind === "engine" ? "71.2" : "57.4",
      registerEntryId: entry.id,
      protectedConstituency: entry.protectedConstituency,
      risk: entry.risk,
      status,
      evidence: `${entry.name} is registered with public model card ${entry.publicModelCard.modelCardId}; ${entry.publicModelCard.monitoring}`,
      requiredAction: status === "action-required" ? "Block production activation until G6 review and human-review gating are restored." : status === "watch" ? "Quarterly G6 review required before scale-up; publish remediation if disparity is observed." : "Continue monitoring; no disparity action required from register metadata.",
    }
  })
  return {
    reportId: `BA-${input.period}`,
    period: input.period,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    findings,
    summary: {
      total: findings.length,
      pass: findings.filter((f) => f.status === "pass").length,
      watch: findings.filter((f) => f.status === "watch").length,
      actionRequired: findings.filter((f) => f.status === "action-required").length,
      highRiskHumanReviewed: entries.filter((e) => e.risk === "high" && e.status === "human-review-required").length,
    },
  }
}

export function generateAnnualAiTransparencyReport(input: { year: number; generatedAt?: string; biasAudit?: BiasAuditReport; entries?: AiRegisterEntry[] }): AnnualAiTransparencyReport {
  const entries = input.entries ?? AI_REGISTER
  const biasAudit = input.biasAudit ?? generateQuarterlyBiasAuditReport({ period: `${input.year}-Q4`, generatedAt: input.generatedAt, entries })
  return {
    reportId: `AI-TRANSPARENCY-${input.year}`,
    moduleId: "71.3",
    year: input.year,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    registerSummary: aiRegisterSummary(entries),
    biasAuditSummary: biasAudit.summary,
    publicAssurance: [
      "AI assists; humans decide. No agent may deny benefits, close grievances or evaluate teachers autonomously.",
      "Public report contains only aggregate/register metadata; no child-level data, prompts or features are disclosed.",
      "High-risk engines and agents remain subject to G6 human-review and quarterly bias audit watch.",
    ],
  }
}

export function biasAuditToCSV(report: BiasAuditReport): string {
  const header = ["id", "moduleId", "registerEntryId", "protectedConstituency", "risk", "status", "requiredAction"]
  const rows = report.findings.map((f) => [f.id, f.moduleId, f.registerEntryId, f.protectedConstituency, f.risk, f.status, f.requiredAction])
  return [header, ...rows].map((row) => row.map(csvField).join(",")).join("\r\n") + "\r\n"
}
