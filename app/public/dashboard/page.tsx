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
        { label: "Transparency (NEP Tracker)", href: "/tracking/dashboard" },
        { label: "School Registry (UDISE+)", href: "/school-registry" },
        { label: "Scheme Tracking", href: "/schemes" },
        { label: "RTI Register", href: "/rti" },
        { label: "Citizen Feedback", href: "/feedback" },
        { label: "Grievances", href: "/grievance" },
        { label: "File a Grievance (tracked & escalated)", href: "/grievance-approvals/new" },
        { label: "Apply for RTE Admission (25% quota)", href: "/admissions-approvals/new" },
        { label: "Apply for a Scholarship / Benefit (DBT)", href: "/scholarship-approvals/new" },
        { label: "File an RTI (RTI Act 2005)", href: "/rti-approvals/new" },
      ]}
    />
  )
}
