import { PortalDashboard } from "@/components/portal-dashboard"

export default function VendorDashboardPage() {
  return (
    <PortalDashboard
      title="EdTech Vendor (NEAT)"
      description="Marketplace participation — sandbox access, open SDK, outcome reporting and payment reconciliation."
      tierLabel="Ecosystem"
      kpis={[
        { label: "Sandbox Status", value: "Active" },
        { label: "Integrations", value: "2" },
        { label: "Outcome Reports", value: "Monthly" },
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
