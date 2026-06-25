import { PortalDashboard } from "@/components/portal-dashboard"
import { stateRollup } from "@/lib/portal-data"
import { listForumsAction } from "@/app/governance/forums/actions"
import { listRtisAction } from "@/app/rti-approvals/actions"
import { listBudgetsAction } from "@/app/budget-approvals/actions"
import { currentStep } from "@/lib/workflow"
import { countAwaiting } from "@/lib/workflow/pending"
import { FORUM_RESOLUTION, RTI_REQUEST, BUDGET_SANCTION } from "@/lib/workflow/definitions"

export const dynamic = "force-dynamic"

export default async function SecretaryDashboardPage() {
  const r = stateRollup()
  const [forums, rtis, budgets] = await Promise.all([listForumsAction(), listRtisAction(), listBudgetsAction()])
  const awaitingSecretary = forums.filter(
    (f) => f.instance.status === "in_progress" && currentStep(FORUM_RESOLUTION, f.instance)?.approverRole === "SECRETARY",
  ).length
  const rtiAppeals = countAwaiting(rtis, RTI_REQUEST, "SECRETARY")
  const budgetScrutiny = countAwaiting(budgets, BUDGET_SANCTION, "SECRETARY")
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
        { label: "RTI second appeals (SIC)", value: String(rtiAppeals), hint: "live · awaiting Commission" },
        { label: "Budget proposals: your scrutiny", value: String(budgetScrutiny), hint: "live · awaiting Finance" },
      ]}
      modules={[
        { label: "My Approvals — all workflows", href: "/approvals" },
        { label: "All-Directorate KPIs", href: "/governance/dashboard" },
        { label: "Governance Forums & Meetings (RACI)", href: "/governance/forums" },
        { label: "RTI Second Appeals (State Information Commission)", href: "/rti-approvals" },
        { label: "Policy Implementation (NEP)", href: "/tracking/dashboard" },
        { label: "Scheme Impact Dashboards", href: "/schemes" },
        { label: "Policies & Circulars", href: "/policies" },
        { label: "Government Structure", href: "/governance/org" },
        { label: "Risk Register (Challenges)", href: "/tracking/challenges" },
        { label: "Assembly Q&A Briefing Pack", href: "/governance/assembly-briefing" },
        { label: "Budget Sanction & Re-appropriation — scrutinise (Finance)", href: "/budget-approvals" },
        { label: "Scheme Fund Flow (PFMS) — sanction → release → utilisation", href: "/governance/fund-flow" },
        { label: "Inter-departmental & CSR Coordination", href: "/governance/coordination" },
        { label: "Cabinet Note Drafting", href: "/governance/cabinet-note" },
        { label: "State-tier Grievance Disposal", href: "/governance/grievance-disposal" },
        { label: "School Recognition Oversight", href: "/governance/recognition-oversight" },
        { label: "Cadre / PTR Rationalisation", href: "/governance/cadre-rationalisation" },
        { label: "My Capability Coverage (honest)", href: "/governance/secretary-capabilities" },
        { label: "Brochure Coverage Map (honest)", href: "/governance/brochure-coverage" },
        { label: "The Six AI Engines (advisory)", href: "/ai-engines" },
        { label: "The Native-AI Fabric (pillars · engines · agents)", href: "/ai-fabric" },
        { label: "NDEAR-S 29 Building Blocks", href: "/governance/ndear-s" },
        { label: "State-Scale Validation (1.27 Cr)", href: "/governance/scale" },
        { label: "WCAG 2.1 Conformance Map", href: "/governance/wcag" },
      ]}
    />
  )
}
