import { PortalDashboard } from "@/components/portal-dashboard"
import { stateRollup } from "@/lib/portal-data"
import { listGrievances } from "@/lib/grievance/store"

export default async function PublicDashboardPage() {
  const r = stateRollup()
  const grievances = await listGrievances()
  const open = grievances.filter((g) => g.status !== "resolved").length
  return (
    <PortalDashboard
      title="Public / Citizen"
      description="Transparency by default — public dashboards, school finder, scheme tracking and RTI workflow."
      tierLabel="Public"
      kpis={[
        { label: "Schools", value: String(r.schools), hint: "in live register" },
        { label: "Students", value: String(r.students) },
        { label: "Open Grievances", value: String(open), hint: "live" },
        { label: "Schemes Tracked", value: String(r.distinctSchemes) },
      ]}
      modules={[
        "Public Performance Dashboards",
        "School Finder",
        "Scheme Tracking",
        "RTI Workflow (auto-disclosure)",
        "Citizen Feedback",
        "Grievance Escalation",
      ]}
    />
  )
}
