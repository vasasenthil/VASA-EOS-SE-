import { PortalDashboard } from "@/components/portal-dashboard"
import { studentDashboardData } from "@/lib/dashboards/live-data"

export default async function StudentDashboardPage() {
  const dashboard = await studentDashboardData()
  return <PortalDashboard {...dashboard} />
}
