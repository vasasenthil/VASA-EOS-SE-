import { PortalDashboard } from "@/components/portal-dashboard"
import { integrationModes } from "@/lib/integrations/config"

export default function VendorDashboardPage() {
  const adapters = Object.keys(integrationModes).length
  const live = Object.values(integrationModes).filter((m) => m === "live").length
  return (
    <PortalDashboard
      title="EdTech Vendor (NEAT)"
      description="Marketplace participation — sandbox access, open SDK, outcome reporting and payment reconciliation."
      tierLabel="Ecosystem"
      kpis={[
        { label: "Sandbox Status", value: "Active" },
        { label: "Integration Adapters", value: String(adapters), hint: "India Stack seams" },
        { label: "Live Integrations", value: String(live), hint: live === 0 ? "mock-backed" : "production" },
        { label: "Quality Score", value: "A" },
      ]}
      modules={[
        "NEAT Marketplace Listing",
        "Sandbox Environment",
        "Open SDK / API Integration",
        "Outcome Reporting",
        "Quality Feedback",
        "Payment Reconciliation",
      ]}
    />
  )
}
