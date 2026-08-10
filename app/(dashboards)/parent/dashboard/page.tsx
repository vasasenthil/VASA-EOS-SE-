import { PortalDashboard } from "@/components/portal-dashboard"
import { parentDashboardData } from "@/lib/dashboards/live-data"

export default function ParentDashboardPage() {
  const dashboard = parentDashboardData()
  return <PortalDashboard {...dashboard} />
}
