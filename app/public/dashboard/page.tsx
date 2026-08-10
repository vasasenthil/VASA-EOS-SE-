import { PortalDashboard } from "@/components/portal-dashboard"
import { publicDashboardData } from "@/lib/dashboards/live-data"

export default async function PublicDashboardPage() {
  const dashboard = await publicDashboardData()
  return <PortalDashboard {...dashboard} />
}
