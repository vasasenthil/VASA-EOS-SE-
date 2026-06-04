import { PortalDashboard } from "@/components/portal-dashboard"

export default function SecretaryDashboardPage() {
  return (
    <PortalDashboard
      title="Secretary, School Education"
      description="State-wide visibility across all 7 directorates — scheme impact, policy decisions and Assembly preparation."
      tierLabel="State"
      kpis={[
        { label: "Students", value: "1.27 Cr" },
        { label: "Teachers", value: "4.5 L" },
        { label: "Directorates", value: "7" },
        { label: "Top Risks", value: "3", hint: "register" },
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
