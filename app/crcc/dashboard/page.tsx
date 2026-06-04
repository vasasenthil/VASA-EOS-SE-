import { PortalDashboard } from "@/components/portal-dashboard"

export default function CrccDashboardPage() {
  return (
    <PortalDashboard
      title="CRC Coordinator"
      description="Mobile-first field operations — GPS-verified visits, teacher mentoring and NIPUN cluster tracking."
      tierLabel="Cluster"
      kpis={[
        { label: "Schools in Cluster", value: "18" },
        { label: "Visits This Month", value: "42", hint: "GPS-verified" },
        { label: "NIPUN On-Track", value: "71%" },
        { label: "Open Mentoring Tasks", value: "6" },
      ]}
      modules={[
        "GPS-Verified School Visits",
        "Teacher Mentoring",
        "NIPUN / Ennum Ezhuthum Tracking",
        "Community Engagement",
        "Offline Field Sync",
        "Quick Reporting (voice/form)",
      ]}
    />
  )
}
