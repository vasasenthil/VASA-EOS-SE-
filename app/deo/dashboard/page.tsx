import { PortalDashboard } from "@/components/portal-dashboard"
import { stateRollup, complianceLabel } from "@/lib/portal-data"

export default function DeoDashboardPage() {
  const r = stateRollup()
  return (
    <PortalDashboard
      title="District Education Officer / CEO"
      description="District operations — real-time KPIs by school and block, compliance traffic-light and resource allocation."
      tierLabel="District"
      kpis={[
        { label: "Schools", value: String(r.schools), hint: "in live register" },
        { label: "Students", value: String(r.students), hint: `${r.avgAttendance}% avg attendance` },
        { label: "At-risk learners", value: String(r.atRisk), hint: "predictive flags" },
        { label: "Compliance", value: complianceLabel(r.compliance), hint: "RTE/RPwD/DPDP" },
      ]}
      modules={[
        { label: "District KPI & Heat Maps", href: "/tracking/dashboard" },
        { label: "Recognition Approvals (DEO scrutiny)", href: "/recognition-approvals" },
        { label: "Leave Approvals (DEO tier)", href: "/leave-approvals" },
        { label: "Quality & Compliance", href: "/quality" },
        { label: "Teacher Deployment / Vacancy", href: "/vacancy" },
        { label: "Grievances", href: "/grievance" },
      ]}
    />
  )
}
