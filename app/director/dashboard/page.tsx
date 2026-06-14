import { PortalDashboard } from "@/components/portal-dashboard"
import { stateRollup } from "@/lib/portal-data"
import { listApplications } from "@/lib/recognition/store"
import { listRecognitionsAction } from "@/app/recognition-approvals/actions"
import { listForumsAction } from "@/app/governance/forums/actions"
import { listTransfersAction } from "@/app/transfer-approvals/actions"
import { listWorksAction } from "@/app/works-approvals/actions"
import { listIndentsAction } from "@/app/procurement-approvals/actions"
import { countAwaiting } from "@/lib/workflow/pending"
import { RECOGNITION_APPROVAL, FORUM_RESOLUTION, TRANSFER_REQUEST, INFRA_WORKS, GEM_PROCUREMENT } from "@/lib/workflow/definitions"

export const dynamic = "force-dynamic"

export default async function DirectorDashboardPage() {
  const r = stateRollup()
  const [apps, recognitions, forums, transfers, works, indents] = await Promise.all([
    listApplications(),
    listRecognitionsAction(),
    listForumsAction(),
    listTransfersAction(),
    listWorksAction(),
    listIndentsAction(),
  ])
  const pending = apps.filter((a) => a.status === "in_progress").length
  const awaitingDirector =
    countAwaiting(recognitions, RECOGNITION_APPROVAL, "DIRECTOR") +
    countAwaiting(forums, FORUM_RESOLUTION, "DIRECTOR") +
    countAwaiting(transfers, TRANSFER_REQUEST, "DIRECTOR") +
    countAwaiting(works, INFRA_WORKS, "DIRECTOR") +
    countAwaiting(indents, GEM_PROCUREMENT, "DIRECTOR")
  return (
    <PortalDashboard
      title="State Director (Directorate)"
      description="Directorate-wide operations across districts — policy implementation, statutory reporting and performance."
      tierLabel="Directorate"
      kpis={[
        { label: "Awaiting your decision", value: String(awaitingDirector), hint: "live · recognition + forum adoption" },
        { label: "Districts", value: String(r.districts) },
        { label: "Recognition Pipeline", value: String(pending), hint: "live · TN 1973" },
        { label: "Avg Quality Index", value: String(r.avgQualityIndex), hint: "0-100" },
      ]}
      modules={[
        { label: "My Approvals — all workflows", href: "/approvals" },
        { label: "School Recognition (TN 1973)", href: "/recognition" },
        { label: "Recognition Approvals — file & decide (BEO→DEO→Director)", href: "/recognition-approvals" },
        { label: "Governance Forums — adopt resolutions (Director quorum)", href: "/governance/forums" },
        { label: "Teacher Transfer — inter-district sanction", href: "/transfer-approvals" },
        { label: "Infrastructure Works — high-value approval", href: "/works-approvals" },
        { label: "GeM Procurement — tender approval", href: "/procurement-approvals" },
        { label: "Policy Implementation Tracking", href: "/tracking/dashboard" },
        { label: "Schemes", href: "/schemes" },
        { label: "Quality & Inspection", href: "/quality" },
        { label: "Reports & Analytics", href: "/tracking/reports" },
        { label: "Governance Overview", href: "/governance/dashboard" },
        { label: "The 7 Directorates", href: "/governance/directorates" },
        { label: "Resource Allocation (need-weighted)", href: "/governance/resource-allocation" },
        { label: "My Capability Coverage (honest)", href: "/governance/director-capabilities" },
      ]}
    />
  )
}
