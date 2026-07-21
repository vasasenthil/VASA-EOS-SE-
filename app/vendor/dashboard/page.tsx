import { PortalDashboard } from "@/components/portal-dashboard"
import { vendorDashboardData } from "@/lib/dashboards/live-data"

export default async function VendorDashboardPage() {
  const dashboard = await vendorDashboardData()
  return <PortalDashboard {...dashboard} />
}
