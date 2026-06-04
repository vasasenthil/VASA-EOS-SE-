import { PortalDashboard } from "@/components/portal-dashboard"

export default function ResearcherDashboardPage() {
  return (
    <PortalDashboard
      title="Researcher"
      description="Anonymised datasets and federated study tools — privacy-preserving, IRB-gated, publication-ready."
      tierLabel="National"
      kpis={[
        { label: "Datasets", value: "12", hint: "anonymised" },
        { label: "Active Studies", value: "3" },
        { label: "IRB Status", value: "Approved" },
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
