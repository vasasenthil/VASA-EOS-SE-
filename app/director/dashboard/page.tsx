import { PortalDashboard } from "@/components/portal-dashboard"

export default function DirectorDashboardPage() {
  return (
    <PortalDashboard
      title="State Director (Directorate)"
      description="Directorate-wide operations across districts — policy implementation, statutory reporting and performance."
      tierLabel="Directorate"
      kpis={[
        { label: "Districts", value: "38" },
        { label: "Schools", value: "69,000+" },
        { label: "Statutory Reports Due", value: "4" },
        { label: "Quality Index", value: "Above avg" },
      ]}
      modules={[
        "Directorate Operations",
        "Cross-District Visibility",
        "Policy Implementation Tracking",
        "Statutory Reporting",
        "Performance Management",
        "Vendor Management",
      ]}
    />
  )
}
