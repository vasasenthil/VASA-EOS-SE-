import { PortalDashboard } from "@/components/portal-dashboard"
import { crccDashboardData } from "@/lib/dashboards/live-data"

export default function CrccDashboardPage() {
  const dashboard = crccDashboardData()
  return <PortalDashboard {...dashboard} />
}
