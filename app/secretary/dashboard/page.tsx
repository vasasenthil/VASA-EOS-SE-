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
        { label: "All-Directorate KPIs", href: "/governance/dashboard" },
        { label: "Policy Implementation (NEP)", href: "/tracking/dashboard" },
        { label: "Scheme Impact Dashboards", href: "/schemes" },
        { label: "Policies & Circulars", href: "/policies" },
        { label: "Government Structure", href: "/governance/org" },
        { label: "Risk Register (Challenges)", href: "/tracking/challenges" },
        { label: "Assembly Q&A Briefing Pack", href: "/governance/assembly-briefing" },
        { label: "Budget Sanction & Re-appropriation", href: "/governance/budget-sanction" },
        { label: "Inter-departmental & CSR Coordination", href: "/governance/coordination" },
        { label: "My Capability Coverage (honest)", href: "/governance/secretary-capabilities" },
      ]}
    />
  )
}
