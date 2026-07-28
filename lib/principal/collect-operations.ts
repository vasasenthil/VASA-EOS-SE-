import "server-only"

import { listTicketFlowsAction } from "@/app/maintenance-approvals/actions"
import { listResolutionsAction } from "@/app/smc-approvals/actions"
import { listClassAttendanceAction } from "@/app/attendance/actions"
import { latestFeeCollectionAction } from "@/app/fees/actions"
import { latestTeacherPresenceAction } from "@/app/staff-attendance/actions"
import { latestEnrolmentAction } from "@/app/enrolment/actions"
import { listDropoutRiskAction } from "@/app/dropout/actions"
import { listComplianceAction } from "@/app/compliance/actions"
import { listSyllabusAction } from "@/app/syllabus/actions"
import { listAssessmentsAction } from "@/app/assessment-schedule/actions"
import { rollup } from "@/lib/attendance/class-day"
import { summarise as summariseCompliance } from "@/lib/compliance/checklist"
import { viewFor } from "@/lib/fees/collection"
import { summarise as summariseSyllabus } from "@/lib/syllabus"
import type { SchoolOperationsSnapshot } from "./operations-centre"

export async function collectSchoolOperationsSnapshot(schoolId: string): Promise<SchoolOperationsSnapshot> {
  const [tickets, resolutions, attendanceRows, feeSnapshot, presence, enrolment, dropout, compliance, syllabus, assessments] = await Promise.all([
    listTicketFlowsAction(), listResolutionsAction(), listClassAttendanceAction(schoolId), latestFeeCollectionAction(schoolId), latestTeacherPresenceAction(schoolId), latestEnrolmentAction(schoolId), listDropoutRiskAction(schoolId), listComplianceAction(schoolId), listSyllabusAction(schoolId), listAssessmentsAction(schoolId),
  ])
  const attendance = rollup(attendanceRows)
  const complianceSummary = summariseCompliance(compliance)
  const syllabusSummary = summariseSyllabus(syllabus)
  const fee = feeSnapshot ? viewFor(feeSnapshot) : null
  return {
    students: enrolment?.total ?? null,
    teachersPresent: presence?.present ?? null,
    teachersTotal: presence?.total ?? null,
    attendancePct: attendance.pct,
    feeCollectionPct: fee?.collectedPct ?? null,
    dropoutRisk: dropout.length,
    highDropoutRisk: dropout.filter((row) => row.assessment.band === "High").length,
    compliancePct: complianceSummary.pct,
    complianceOverdue: complianceSummary.overdue,
    syllabusPct: syllabusSummary.avgPct,
    openMaintenance: tickets.filter((row) => row.instance.status === "in_progress").length,
    pendingSmcResolutions: resolutions.filter((row) => row.instance.status === "in_progress").length,
    upcomingAssessments: assessments.length,
  }
}
