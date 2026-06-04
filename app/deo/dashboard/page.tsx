import { PortalDashboard } from "@/components/portal-dashboard"

export default function DeoDashboardPage() {
  return (
    <PortalDashboard
      title="District Education Officer / CEO"
      description="District operations — real-time KPIs by school and block, compliance traffic-light and resource allocation."
      tierLabel="District"
      kpis={[
        { label: "Schools", value: "1,840" },
        { label: "Blocks", value: "11" },
        { label: "Dropout (9-10)", value: "5.2%", hint: "target <3.5%" },
        { label: "Compliance", value: "Amber", hint: "RTE/RPwD/DPDP" },
      ]}
      modules={[
        "District KPI & Heat Maps",
        "Compliance Traffic-Light",
        "Teacher Deployment",
        "Resource Allocation",
        "DIET Coordination",
        "Inter-Departmental Coordination",
      ]}
    />
  )
}
