import { csvField } from "@/lib/csv"

export interface SchoolOperationsSnapshot {
  students: number | null
  teachersPresent: number | null
  teachersTotal: number | null
  attendancePct: number
  feeCollectionPct: number | null
  dropoutRisk: number
  highDropoutRisk: number
  compliancePct: number
  complianceOverdue: number
  syllabusPct: number
  openMaintenance: number
  pendingSmcResolutions: number
  upcomingAssessments: number
}

export interface SchoolIntervention {
  id: string
  severity: "critical" | "high" | "watch"
  title: string
  detail: string
  href: string
}

export interface SchoolOperationsReport {
  generatedAt: string
  schoolId: string
  snapshot: SchoolOperationsSnapshot
  interventions: SchoolIntervention[]
  readiness: { domain: string; score: number; href: string }[]
  evidence: { source: string; mode: "live-store" | "derived-live"; scope: string }[]
}

const bounded = (value: number) => Math.max(0, Math.min(100, Math.round(value)))

export function buildSchoolOperationsReport(snapshot: SchoolOperationsSnapshot, schoolId: string, generatedAt = new Date().toISOString()): SchoolOperationsReport {
  const interventions: SchoolIntervention[] = []
  if (snapshot.highDropoutRisk > 0) interventions.push({ id: "learner-risk", severity: "critical", title: "High learner-retention risk", detail: `${snapshot.highDropoutRisk} learner(s) require a documented human-led intervention.`, href: "/dropout" })
  if (snapshot.complianceOverdue > 0) interventions.push({ id: "compliance", severity: "critical", title: "Overdue statutory obligations", detail: `${snapshot.complianceOverdue} compliance item(s) are overdue.`, href: "/principal/compliance" })
  if (snapshot.attendancePct < 85) interventions.push({ id: "attendance", severity: "high", title: "Attendance below operating threshold", detail: `Current school attendance is ${snapshot.attendancePct}%; review class and learner exceptions.`, href: "/attendance" })
  if (snapshot.openMaintenance > 0) interventions.push({ id: "maintenance", severity: "high", title: "Open maintenance workload", detail: `${snapshot.openMaintenance} maintenance workflow(s) remain active.`, href: "/maintenance-approvals" })
  if (snapshot.pendingSmcResolutions > 0) interventions.push({ id: "smc", severity: "watch", title: "SMC governance queue", detail: `${snapshot.pendingSmcResolutions} SMC resolution(s) remain in progress.`, href: "/smc-approvals" })
  if (snapshot.syllabusPct < 75) interventions.push({ id: "syllabus", severity: "watch", title: "Curriculum delivery watch", detail: `Syllabus completion is ${snapshot.syllabusPct}%.`, href: "/syllabus" })

  const teacherPresence = snapshot.teachersTotal ? (snapshot.teachersPresent ?? 0) / snapshot.teachersTotal * 100 : 0
  return {
    generatedAt,
    schoolId,
    snapshot,
    interventions,
    readiness: [
      { domain: "Student attendance", score: bounded(snapshot.attendancePct), href: "/attendance" },
      { domain: "Teacher presence", score: bounded(teacherPresence), href: "/staff-attendance" },
      { domain: "Statutory compliance", score: bounded(snapshot.compliancePct), href: "/principal/compliance" },
      { domain: "Curriculum completion", score: bounded(snapshot.syllabusPct), href: "/syllabus" },
      { domain: "Fee realisation", score: bounded(snapshot.feeCollectionPct ?? 0), href: "/principal/fee-management" },
    ],
    evidence: [
      { source: "Attendance, enrolment and teacher-presence stores", mode: "live-store", scope: schoolId },
      { source: "Compliance, syllabus, assessment and workflow stores", mode: "live-store", scope: schoolId },
      { source: "Rules-derived intervention and readiness model", mode: "derived-live", scope: schoolId },
    ],
  }
}

export function schoolOperationsReportToCsv(report: SchoolOperationsReport): string {
  const s = report.snapshot
  const rows: Array<Array<string | number>> = [
    ["metadata", "generated_at", report.generatedAt], ["metadata", "school_id", report.schoolId],
    ["operations", "students", s.students ?? ""], ["operations", "teachers_present", s.teachersPresent ?? ""],
    ["operations", "teachers_total", s.teachersTotal ?? ""], ["operations", "attendance_pct", s.attendancePct],
    ["operations", "fee_collection_pct", s.feeCollectionPct ?? ""], ["operations", "high_dropout_risk", s.highDropoutRisk],
    ["compliance", "completion_pct", s.compliancePct], ["compliance", "overdue", s.complianceOverdue],
    ["academic", "syllabus_pct", s.syllabusPct], ["operations", "open_maintenance", s.openMaintenance],
    ...report.interventions.map((item) => ["intervention", item.severity, `${item.title}: ${item.detail}`]),
  ]
  return ["section,metric,value", ...rows.map((row) => row.map((value) => csvField(String(value))).join(","))].join("\r\n") + "\r\n"
}
