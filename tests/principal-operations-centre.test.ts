import test from "node:test"
import assert from "node:assert/strict"
import { buildSchoolOperationsReport, schoolOperationsReportToCsv, type SchoolOperationsSnapshot } from "@/lib/principal/operations-centre"
import { extractRoles } from "@/lib/auth/role-extractor"

const snapshot: SchoolOperationsSnapshot = { students: 500, teachersPresent: 28, teachersTotal: 30, attendancePct: 82, feeCollectionPct: 90, dropoutRisk: 4, highDropoutRisk: 2, compliancePct: 70, complianceOverdue: 1, syllabusPct: 68, openMaintenance: 3, pendingSmcResolutions: 2, upcomingAssessments: 4 }

test("normalizes Headmaster identity to the governed Principal authority", () => {
  const roles = extractRoles({ subject: "head-1", roles: ["HEADMASTER"], metadata: {}, tenant: { schoolId: "S1" } })
  assert.deepEqual(roles, ["PRINCIPAL"])
})

test("builds school-scoped readiness and deterministic interventions", () => {
  const report = buildSchoolOperationsReport(snapshot, "TN-CHN-B1-S1", "2026-07-28T00:00:00.000Z")
  assert.equal(report.schoolId, "TN-CHN-B1-S1")
  assert.deepEqual(report.interventions.map((item) => item.id), ["learner-risk", "compliance", "attendance", "maintenance", "smc", "syllabus"])
  assert.equal(report.readiness.length, 5)
  assert.ok(report.readiness.every((item) => item.score >= 0 && item.score <= 100))
  assert.ok(report.evidence.every((item) => item.scope === "TN-CHN-B1-S1"))
})

test("does not raise intervention signals when operating thresholds are clear", () => {
  const report = buildSchoolOperationsReport({ ...snapshot, attendancePct: 95, highDropoutRisk: 0, complianceOverdue: 0, syllabusPct: 90, openMaintenance: 0, pendingSmcResolutions: 0 }, "S1")
  assert.equal(report.interventions.length, 0)
})

test("exports protected school operations report as RFC-compatible CSV", () => {
  const csv = schoolOperationsReportToCsv(buildSchoolOperationsReport(snapshot, 'SCHOOL,"1"'))
  assert.match(csv, /school_id,"SCHOOL,""1"""/)
  assert.match(csv, /attendance_pct,82/)
  assert.ok(csv.endsWith("\r\n"))
})
