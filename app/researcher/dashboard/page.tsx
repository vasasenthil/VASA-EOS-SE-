import { PortalDashboard } from "@/components/portal-dashboard"
import { stateRollup } from "@/lib/portal-data"

export default function ResearcherDashboardPage() {
  const r = stateRollup()
  return (
    <PortalDashboard
      title="Researcher"
      description="Anonymised datasets and federated study tools — privacy-preserving, IRB-gated, publication-ready."
      tierLabel="National"
      kpis={[
        { label: "Cohort (anon.)", value: String(r.students), hint: "k-anonymised" },
        { label: "Schools", value: String(r.schools) },
        { label: "CWSN Records", value: String(r.cwsn), hint: "21 RPwD categories" },
        { label: "Privacy", value: "k-anon + DP" },
      ]}
      modules={[
        { label: "Data Platform (anonymised)", href: "/data-platform" },
        { label: "Knowledge Graph", href: "/knowledge-graph" },
        { label: "Reports & Analytics", href: "/tracking/reports" },
        { label: "Adoption & Retention", href: "/adoption" },
        { label: "Consent & Audit", href: "/consent" },
        { label: "Accessibility / CWSN", href: "/cwsn" },
      ]}
    />
  )
}
