import test from "node:test"
import assert from "node:assert/strict"
import { AI_REGISTER } from "../lib/ai/register"
import { biasAuditToCSV, generateAnnualAiTransparencyReport, generateQuarterlyBiasAuditReport } from "../lib/ai/transparency"

test("quarterly bias audit covers every register entry and watches high-risk HITL entries", () => {
  const report = generateQuarterlyBiasAuditReport({ period: "2026-Q3", generatedAt: "2026-07-21T00:00:00.000Z" })
  const highRiskHumanReview = AI_REGISTER.filter((entry) => entry.risk === "high" && entry.status === "human-review-required").length

  assert.equal(report.reportId, "BA-2026-Q3")
  assert.equal(report.findings.length, AI_REGISTER.length)
  assert.equal(report.summary.total, AI_REGISTER.length)
  assert.equal(report.summary.highRiskHumanReviewed, highRiskHumanReview)
  assert.equal(report.summary.actionRequired, 0)
  assert.ok(report.findings.some((finding) => finding.status === "watch" && finding.moduleId === "71.2"))
  assert.ok(report.findings.some((finding) => finding.status === "watch" && finding.moduleId === "57.4"))
})

test("bias audit marks high-risk entries without human-review gating as action-required", () => {
  const tampered = { ...AI_REGISTER[0], risk: "high" as const, status: "registered" as const }
  const report = generateQuarterlyBiasAuditReport({ period: "2026-Q3", entries: [tampered] })

  assert.equal(report.summary.actionRequired, 1)
  assert.equal(report.findings[0].status, "action-required")
  assert.match(report.findings[0].requiredAction, /Block production activation/)
})

test("annual AI transparency report stays aggregate and charter aligned", () => {
  const report = generateAnnualAiTransparencyReport({ year: 2026, generatedAt: "2026-07-21T00:00:00.000Z" })

  assert.equal(report.moduleId, "71.3")
  assert.equal(report.registerSummary.charterAligned, true)
  assert.ok(report.publicAssurance.some((assurance) => assurance.includes("AI assists; humans decide")))
  assert.ok(report.publicAssurance.some((assurance) => assurance.includes("no child-level data")))
})

test("bias audit CSV is public-safe and excludes child-level fields", () => {
  const report = generateQuarterlyBiasAuditReport({ period: "2026-Q3" })
  const csv = biasAuditToCSV(report)

  assert.equal(csv.trim().split("\r\n").length, report.findings.length + 1)
  assert.doesNotMatch(csv, /apaar|studentName|prompt|inputFeatures/i)
  assert.match(csv, /requiredAction/)
})
