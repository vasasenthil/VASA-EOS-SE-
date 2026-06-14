import { PortalDashboard } from "@/components/portal-dashboard"
import { stateRollup } from "@/lib/portal-data"
import { listGrievances } from "@/lib/grievance/store"
import { listRecognitionsAction } from "@/app/recognition-approvals/actions"
import { listLeaveFlowsAction } from "@/app/leave-approvals/actions"
import { listGrievanceFlowsAction } from "@/app/grievance-approvals/actions"
import { listScholarshipsAction } from "@/app/scholarship-approvals/actions"
import { listReferralsAction } from "@/app/health-referrals/actions"
import { listTransfersAction } from "@/app/transfer-approvals/actions"
import { listWorksAction } from "@/app/works-approvals/actions"
import { listIncidentsAction } from "@/app/safety-incidents/actions"
import { countAwaiting } from "@/lib/workflow/pending"
import { RECOGNITION_APPROVAL, LEAVE_APPROVAL, GRIEVANCE_ESCALATION, SCHOLARSHIP_SANCTION, HEALTH_REFERRAL, TRANSFER_REQUEST, INFRA_WORKS, SAFETY_INCIDENT } from "@/lib/workflow/definitions"

export const dynamic = "force-dynamic"

export default async function BeoDashboardPage() {
  const r = stateRollup()
  const [grievances, recognitions, leaves, grievanceFlows, scholarships, referrals, transfers, works, incidents] = await Promise.all([
    listGrievances(),
    listRecognitionsAction(),
    listLeaveFlowsAction(),
    listGrievanceFlowsAction(),
    listScholarshipsAction(),
    listReferralsAction(),
    listTransfersAction(),
    listWorksAction(),
    listIncidentsAction(),
  ])
  const open = grievances.filter((g) => g.status !== "resolved").length
  const awaitingBeo =
    countAwaiting(recognitions, RECOGNITION_APPROVAL, "BEO") +
    countAwaiting(leaves, LEAVE_APPROVAL, "BEO") +
    countAwaiting(grievanceFlows, GRIEVANCE_ESCALATION, "BEO") +
    countAwaiting(scholarships, SCHOLARSHIP_SANCTION, "BEO") +
    countAwaiting(referrals, HEALTH_REFERRAL, "BEO") +
    countAwaiting(transfers, TRANSFER_REQUEST, "BEO") +
    countAwaiting(works, INFRA_WORKS, "BEO") +
    countAwaiting(incidents, SAFETY_INCIDENT, "BEO")
  return (
    <PortalDashboard
      title="Block Education Officer"
      description="Block operations — AI-prioritised inspections, CRC coordination, scheme implementation and grievances."
      tierLabel="Block"
      kpis={[
        { label: "Awaiting your decision", value: String(awaitingBeo), hint: "live · recognition + leave + grievance" },
        { label: "Schools", value: String(r.schools) },
        { label: "Inspections Due", value: String(r.inspectionsDue), hint: "AI-prioritised" },
        { label: "Open Grievances", value: String(open), hint: "live · SLA-tracked" },
      ]}
      modules={[
        { label: "Recognition Approvals (BEO verification)", href: "/recognition-approvals" },
        { label: "Leave Approvals (BEO tier)", href: "/leave-approvals" },
        { label: "Grievance Escalation (Block)", href: "/grievance-approvals" },
        { label: "Scholarship / Benefit Sanction", href: "/scholarship-approvals" },
        { label: "RBSK Health Referrals", href: "/health-referrals" },
        { label: "Teacher Transfer & Counselling", href: "/transfer-approvals" },
        { label: "Infrastructure Works Sanction", href: "/works-approvals" },
        { label: "Child-Safety Incidents (POCSO)", href: "/safety-incidents" },
        { label: "AI-Prioritised Inspections", href: "/inspections" },
        { label: "Grievance Management", href: "/grievance" },
        { label: "Scheme Implementation", href: "/schemes" },
        { label: "Block KPIs (NEP Tracker)", href: "/tracking/dashboard" },
      ]}
    />
  )
}
