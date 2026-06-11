import { PortalDashboard } from "@/components/portal-dashboard"
import { stateRollup } from "@/lib/portal-data"
import { listForumsAction } from "@/app/governance/forums/actions"
import { currentStep } from "@/lib/workflow"
import { FORUM_RESOLUTION } from "@/lib/workflow/definitions"

export const dynamic = "force-dynamic"

export default async function SecretaryDashboardPage() {
  const r = stateRollup()
  const forums = await listForumsAction()
  const awaitingSecretary = forums.filter(
    (f) => f.instance.status === "in_progress" && currentStep(FORUM_RESOLUTION, f.instance)?.approverRole === "SECRETARY",
  ).length
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
        { label: "Forum items: your adoption", value: String(awaitingSecretary), hint: "live · awaiting Secretary" },
      ]}
      modules={[
        { label: "All-Directorate KPIs", href: "/governance/dashboard" },
        { label: "Governance Forums & Meetings (RACI)", href: "/governance/forums" },
        { label: "Policy Implementation (NEP)", href: "/tracking/dashboard" },
        { label: "Scheme Impact Dashboards", href: "/schemes" },
        { label: "Policies & Circulars", href: "/policies" },
        { label: "Government Structure", href: "/governance/org" },
        { label: "Risk Register (Challenges)", href: "/tracking/challenges" },
        { label: "Assembly Q&A Briefing Pack", href: "/governance/assembly-briefing" },
        { label: "Budget Sanction & Re-appropriation", href: "/governance/budget-sanction" },
        { label: "Inter-departmental & CSR Coordination", href: "/governance/coordination" },
        { label: "Cabinet Note Drafting", href: "/governance/cabinet-note" },
        { label: "State-tier Grievance Disposal", href: "/governance/grievance-disposal" },
        { label: "School Recognition Oversight", href: "/governance/recognition-oversight" },
        { label: "Cadre / PTR Rationalisation", href: "/governance/cadre-rationalisation" },
        { label: "My Capability Coverage (honest)", href: "/governance/secretary-capabilities" },
        { label: "Brochure Coverage Map (honest)", href: "/governance/brochure-coverage" },
      ]}
    />
  )
}
