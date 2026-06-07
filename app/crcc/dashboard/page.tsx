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
        { label: "School Visits & Inspections", href: "/inspections" },
        { label: "Teacher Mentoring (CPD)", href: "/cpd" },
        { label: "NIPUN / Diagnostic", href: "/diagnostic" },
        { label: "Reading Campaign (FLN)", href: "/reading" },
        { label: "Remedial / NIPUN Classes", href: "/remedial" },
        { label: "Grievances", href: "/grievance" },
      ]}
    />
  )
}
