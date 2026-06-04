import { PortalDashboard } from "@/components/portal-dashboard"
import { stateRollup } from "@/lib/portal-data"

export default function SecretaryDashboardPage() {
  const r = stateRollup()
  return (
    <PortalDashboard
      title="Secretary, School Education"
      description="State-wide visibility across all 7 directorates — scheme impact, policy decisions and Assembly preparation."
      tierLabel="State"
      kpis={[
        { label: "Students", value: String(r.students) },
        { label: "Districts", value: String(r.districts) },
        { label: "Avg Quality Index", value: String(r.avgQualityIndex), hint: "0-100" },
        { label: "At-risk learners", value: String(r.atRisk), hint: "risk register" },
      ]}
      modules={[
        "All-Directorate KPIs",
        "Policy Implementation (NEP / TN SEP 2022)",
        "Scheme Impact Dashboards",
        "Inter-Departmental View",
        "Assembly / Parliament Preparation",
        "Risk Register Oversight",
      ]}
    />
  )
}
