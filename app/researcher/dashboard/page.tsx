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
        "Anonymised Dataset Access",
        "Federated Study Tools",
        "Longitudinal Analysis",
        "Cross-State Benchmarking",
        "IRB / Ethics Workflow",
        "Publication-Ready Extracts",
      ]}
    />
  )
}
