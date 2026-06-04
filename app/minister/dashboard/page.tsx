import { PortalDashboard } from "@/components/portal-dashboard"

export default function MinisterDashboardPage() {
  return (
    <PortalDashboard
      title="Hon'ble Minister / Chief Minister"
      description="Executive dashboards — scheme outcomes, constituency view, election-commitment tracking and crisis alerts."
      tierLabel="Executive"
      kpis={[
        { label: "Pudhumai Penn", value: "On-track", hint: "girls in HE" },
        { label: "CMBS Daily", value: "1.27 Cr", hint: "breakfasts" },
        { label: "Naan Mudhalvan", value: "Placements ↑" },
        { label: "Constituencies", value: "234" },
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
