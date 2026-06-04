import { PortalDashboard } from "@/components/portal-dashboard"

export default function BeoDashboardPage() {
  return (
    <PortalDashboard
      title="Block Education Officer"
      description="Block operations — AI-prioritised inspections, CRC coordination, scheme implementation and grievances."
      tierLabel="Block"
      kpis={[
        { label: "Schools in Block", value: "210" },
        { label: "Inspections Due", value: "12", hint: "AI-prioritised" },
        { label: "Open Grievances", value: "9", hint: "SLA-tracked" },
        { label: "Scheme Coverage", value: "94%" },
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
