import { PortalDashboard } from "@/components/portal-dashboard"

export default function PublicDashboardPage() {
  return (
    <PortalDashboard
      title="Public / Citizen"
      description="Transparency by default — public dashboards, school finder, scheme tracking and RTI workflow."
      tierLabel="Public"
      kpis={[
        { label: "Schools (public)", value: "69,000+" },
        { label: "Enrolment K-12", value: "1.27 Cr" },
        { label: "RTI Avg Response", value: "<30 days" },
        { label: "Schemes Tracked", value: "20+" },
      ]}
      modules={[
        "Public Performance Dashboards",
        "School Finder",
        "Scheme Tracking",
        "RTI Workflow (auto-disclosure)",
        "Citizen Feedback",
        "Grievance Escalation",
      ]}
    />
  )
}
