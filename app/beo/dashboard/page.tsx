import { PortalDashboard } from "@/components/portal-dashboard"
import { stateRollup } from "@/lib/portal-data"
import { listGrievances } from "@/lib/grievance/store"
import { listRecognitionsAction } from "@/app/recognition-approvals/actions"
import { listLeaveFlowsAction } from "@/app/leave-approvals/actions"
import { listGrievanceFlowsAction } from "@/app/grievance-approvals/actions"
import { countAwaiting } from "@/lib/workflow/pending"
import { RECOGNITION_APPROVAL, LEAVE_APPROVAL, GRIEVANCE_ESCALATION } from "@/lib/workflow/definitions"

export const dynamic = "force-dynamic"

export default async function BeoDashboardPage() {
  const r = stateRollup()
  const [grievances, recognitions, leaves, grievanceFlows] = await Promise.all([
    listGrievances(),
    listRecognitionsAction(),
    listLeaveFlowsAction(),
    listGrievanceFlowsAction(),
  ])
  const open = grievances.filter((g) => g.status !== "resolved").length
  const awaitingBeo =
    countAwaiting(recognitions, RECOGNITION_APPROVAL, "BEO") +
    countAwaiting(leaves, LEAVE_APPROVAL, "BEO") +
    countAwaiting(grievanceFlows, GRIEVANCE_ESCALATION, "BEO")
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
        { label: "AI-Prioritised Inspections", href: "/inspections" },
        { label: "Grievance Management", href: "/grievance" },
        { label: "Scheme Implementation", href: "/schemes" },
        { label: "Block KPIs (NEP Tracker)", href: "/tracking/dashboard" },
      ]}
    />
  )
}
