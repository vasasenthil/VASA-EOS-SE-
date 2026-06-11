import { PortalDashboard } from "@/components/portal-dashboard"
import { stateRollup, schemeBeneficiaries } from "@/lib/portal-data"
import { listForumsAction } from "@/app/governance/forums/actions"
import { currentStep } from "@/lib/workflow"
import { FORUM_RESOLUTION } from "@/lib/workflow/definitions"

export const dynamic = "force-dynamic"

export default async function MinisterDashboardPage() {
  const r = stateRollup()
  const forums = await listForumsAction()
  const awaitingMinister = forums.filter(
    (f) => f.instance.status === "in_progress" && currentStep(FORUM_RESOLUTION, f.instance)?.approverRole === "MINISTER",
  ).length
  return (
    <PortalDashboard
      title="Hon'ble Minister / Chief Minister"
      description="Executive dashboards — scheme outcomes, constituency view, election-commitment tracking and crisis alerts."
      tierLabel="Executive"
      kpis={[
        { label: "Pudhumai Penn", value: String(schemeBeneficiaries("Pudhumai Penn")), hint: "girls supported" },
        { label: "CMBS", value: String(schemeBeneficiaries("CMBS")), hint: "breakfast beneficiaries" },
        { label: "Scheme Coverage", value: `${r.schemeCoveragePct}%` },
        { label: "Awaiting your ratification", value: String(awaitingMinister), hint: "live · forum items" },
      ]}
      modules={[
        { label: "Executive Outcomes (NEP Tracker)", href: "/tracking/dashboard" },
        { label: "Governance Forums — ratify resolutions", href: "/governance/forums" },
        { label: "Scheme Impact (CMBS / Pudhumai Penn)", href: "/schemes" },
        { label: "Constituency / Stakeholder View", href: "/tracking/stakeholders" },
        { label: "Election-Commitment Milestones", href: "/tracking/milestones" },
        { label: "Reports & Benchmarking", href: "/tracking/reports" },
        { label: "Crisis / Emergency Centre", href: "/emergency" },
        { label: "Welfare-Scheme Launch", href: "/governance/scheme-launch" },
        { label: "Public Communication Desk", href: "/governance/public-communication" },
        { label: "Executive Budget Priorities", href: "/governance/budget-priorities" },
        { label: "Constituency Grievance Redress", href: "/governance/constituency-grievance" },
        { label: "My Capability Coverage (honest)", href: "/governance/minister-capabilities" },
      ]}
    />
  )
}
