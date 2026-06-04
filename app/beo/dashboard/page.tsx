import { PortalDashboard } from "@/components/portal-dashboard"
import { stateRollup } from "@/lib/portal-data"
import { listGrievances } from "@/lib/grievance/store"

export default async function BeoDashboardPage() {
  const r = stateRollup()
  const grievances = await listGrievances()
  const open = grievances.filter((g) => g.status !== "resolved").length
  return (
    <PortalDashboard
      title="Block Education Officer"
      description="Block operations — AI-prioritised inspections, CRC coordination, scheme implementation and grievances."
      tierLabel="Block"
      kpis={[
        { label: "Schools", value: String(r.schools) },
        { label: "Inspections Due", value: String(r.inspectionsDue), hint: "AI-prioritised" },
        { label: "Open Grievances", value: String(open), hint: "live · SLA-tracked" },
        { label: "Scheme Coverage", value: `${r.schemeCoveragePct}%` },
      ]}
      modules={[
        "Block KPI Dashboard",
        "AI-Prioritised Inspections",
        "CRC Coordination",
        "Scheme Implementation",
        "Grievance Management",
        "Teacher CPD Coordination",
      ]}
    />
  )
}
