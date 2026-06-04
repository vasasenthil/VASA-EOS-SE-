import { PortalDashboard } from "@/components/portal-dashboard"
import { stateRollup } from "@/lib/portal-data"

export default function CrccDashboardPage() {
  const r = stateRollup()
  return (
    <PortalDashboard
      title="CRC Coordinator"
      description="Mobile-first field operations — GPS-verified visits, teacher mentoring and NIPUN cluster tracking."
      tierLabel="Cluster"
      kpis={[
        { label: "Schools", value: String(r.schools) },
        { label: "NIPUN On-Track", value: `${r.nipunOnTrackPct}%`, hint: "Ennum Ezhuthum" },
        { label: "At-risk learners", value: String(r.atRisk), hint: "mentoring queue" },
        { label: "Avg Attendance", value: `${r.avgAttendance}%` },
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
