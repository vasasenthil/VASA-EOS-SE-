import { PortalDashboard } from "@/components/portal-dashboard"
import { stateRollup } from "@/lib/portal-data"
import { listApplications } from "@/lib/recognition/store"

export default async function DirectorDashboardPage() {
  const r = stateRollup()
  const apps = await listApplications()
  const pending = apps.filter((a) => a.status === "in_progress").length
  return (
    <PortalDashboard
      title="State Director (Directorate)"
      description="Directorate-wide operations across districts — policy implementation, statutory reporting and performance."
      tierLabel="Directorate"
      kpis={[
        { label: "Districts", value: String(r.districts) },
        { label: "Schools", value: String(r.schools) },
        { label: "Recognition Pipeline", value: String(pending), hint: "live · TN 1973" },
        { label: "Avg Quality Index", value: String(r.avgQualityIndex), hint: "0-100" },
      ]}
      modules={[
        { label: "School Recognition (TN 1973)", href: "/recognition" },
        { label: "Policy Implementation Tracking", href: "/tracking/dashboard" },
        { label: "Schemes", href: "/schemes" },
        { label: "Quality & Inspection", href: "/quality" },
        { label: "Reports & Analytics", href: "/tracking/reports" },
        { label: "Governance Overview", href: "/governance/dashboard" },
        { label: "The 7 Directorates", href: "/governance/directorates" },
        { label: "My Capability Coverage (honest)", href: "/governance/director-capabilities" },
      ]}
    />
  )
}
