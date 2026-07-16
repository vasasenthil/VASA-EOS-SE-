import { PortalDashboard } from "@/components/portal-dashboard"
import { teacherDashboardData } from "@/lib/dashboards/live-data"

export default function TeacherDashboardPage() {
  const dashboard = teacherDashboardData()
  return <PortalDashboard {...dashboard} />
}
