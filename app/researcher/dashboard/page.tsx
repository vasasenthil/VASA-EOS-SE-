import { PortalDashboard } from "@/components/portal-dashboard"
import { researcherDashboardData } from "@/lib/dashboards/live-data"

export default async function ResearcherDashboardPage() {
  const dashboard = await researcherDashboardData()
  return <PortalDashboard {...dashboard} />
}
