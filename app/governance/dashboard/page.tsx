import { PortalDashboard } from "@/components/portal-dashboard"
import { governanceDashboardData } from "@/lib/dashboards/live-data"

export default async function GovernanceDashboardPage() {
  const dashboard = await governanceDashboardData()
  return <PortalDashboard {...dashboard} />
}
