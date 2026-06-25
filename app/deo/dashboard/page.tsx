import { PortalDashboard } from "@/components/portal-dashboard"
import { stateRollup, complianceLabel } from "@/lib/portal-data"
import { listRecognitionsAction } from "@/app/recognition-approvals/actions"
import { listLeaveFlowsAction } from "@/app/leave-approvals/actions"
import { listGrievanceFlowsAction } from "@/app/grievance-approvals/actions"
import { listScholarshipsAction } from "@/app/scholarship-approvals/actions"
import { listReferralsAction } from "@/app/health-referrals/actions"
import { listTransfersAction } from "@/app/transfer-approvals/actions"
import { listWorksAction } from "@/app/works-approvals/actions"
import { listIncidentsAction } from "@/app/safety-incidents/actions"
import { listRtisAction } from "@/app/rti-approvals/actions"
import { listIndentsAction } from "@/app/procurement-approvals/actions"
import { countAwaiting } from "@/lib/workflow/pending"
import { RECOGNITION_APPROVAL, LEAVE_APPROVAL, GRIEVANCE_ESCALATION, SCHOLARSHIP_SANCTION, HEALTH_REFERRAL, TRANSFER_REQUEST, INFRA_WORKS, SAFETY_INCIDENT, RTI_REQUEST, GEM_PROCUREMENT } from "@/lib/workflow/definitions"

export const dynamic = "force-dynamic"

export default async function DeoDashboardPage() {
  const r = stateRollup()
  const [recognitions, leaves, grievanceFlows, scholarships, referrals, transfers, works, incidents, rtis, indents] = await Promise.all([
    listRecognitionsAction(),
    listLeaveFlowsAction(),
    listGrievanceFlowsAction(),
    listScholarshipsAction(),
    listReferralsAction(),
    listTransfersAction(),
    listWorksAction(),
    listIncidentsAction(),
    listRtisAction(),
    listIndentsAction(),
  ])
  const awaitingDeo =
    countAwaiting(recognitions, RECOGNITION_APPROVAL, "DEO") +
    countAwaiting(leaves, LEAVE_APPROVAL, "DEO") +
    countAwaiting(grievanceFlows, GRIEVANCE_ESCALATION, "DEO") +
    countAwaiting(scholarships, SCHOLARSHIP_SANCTION, "DEO") +
    countAwaiting(referrals, HEALTH_REFERRAL, "DEO") +
    countAwaiting(transfers, TRANSFER_REQUEST, "DEO") +
    countAwaiting(works, INFRA_WORKS, "DEO") +
    countAwaiting(incidents, SAFETY_INCIDENT, "DEO") +
    countAwaiting(rtis, RTI_REQUEST, "DEO") +
    countAwaiting(indents, GEM_PROCUREMENT, "DEO")
  return (
    <PortalDashboard
      title="District Education Officer / CEO"
      description="District operations — real-time KPIs by school and block, compliance traffic-light and resource allocation."
      tierLabel="District"
      kpis={[
        { label: "Awaiting your decision", value: String(awaitingDeo), hint: "live · recognition + leave + grievance" },
        { label: "Schools", value: String(r.schools), hint: "in live register" },
        { label: "Students", value: String(r.students), hint: `${r.avgAttendance}% avg attendance` },
        { label: "Compliance", value: complianceLabel(r.compliance), hint: "RTE/RPwD/DPDP" },
      ]}
      modules={[
        { label: "My Approvals — all workflows", href: "/approvals" },
        { label: "District KPI & Heat Maps", href: "/tracking/dashboard" },
        { label: "Recognition Approvals (DEO scrutiny)", href: "/recognition-approvals" },
        { label: "Leave Approvals (DEO tier)", href: "/leave-approvals" },
        { label: "Grievance Escalation (District)", href: "/grievance-approvals" },
        { label: "Scholarship Sanction & DBT Release", href: "/scholarship-approvals" },
        { label: "RBSK Health Referrals (DEIC)", href: "/health-referrals" },
        { label: "Teacher Transfer & Counselling", href: "/transfer-approvals" },
        { label: "Infrastructure Works Sanction (EE)", href: "/works-approvals" },
        { label: "Child-Safety Incidents (DCPU)", href: "/safety-incidents" },
        { label: "RTI — First Appellate Authority", href: "/rti-approvals" },
        { label: "GeM Procurement (financial sanction)", href: "/procurement-approvals" },
        { label: "Quality & Compliance", href: "/quality" },
        { label: "Teacher Deployment / Vacancy", href: "/vacancy" },
        { label: "Grievances", href: "/grievance" },
      ]}
    />
  )
}
