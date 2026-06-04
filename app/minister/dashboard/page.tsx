import { PortalDashboard } from "@/components/portal-dashboard"
import { stateRollup, schemeBeneficiaries } from "@/lib/portal-data"

export default function MinisterDashboardPage() {
  const r = stateRollup()
  return (
    <PortalDashboard
      title="Hon'ble Minister / Chief Minister"
      description="Executive dashboards — scheme outcomes, constituency view, election-commitment tracking and crisis alerts."
      tierLabel="Executive"
      kpis={[
        { label: "Pudhumai Penn", value: String(schemeBeneficiaries("Pudhumai Penn")), hint: "girls supported" },
        { label: "CMBS", value: String(schemeBeneficiaries("CMBS")), hint: "breakfast beneficiaries" },
        { label: "Scheme Coverage", value: `${r.schemeCoveragePct}%` },
        { label: "Districts", value: String(r.districts) },
      ]}
      modules={[
        "Executive Outcomes",
        "Scheme Impact (CMBS / Pudhumai Penn / Naan Mudhalvan)",
        "234 Constituency View",
        "Election-Commitment Tracking",
        "Inter-State Benchmarking",
        "Crisis Centre",
      ]}
    />
  )
}
