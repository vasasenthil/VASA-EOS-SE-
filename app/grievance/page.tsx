import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { GrievancePanel } from "./grievance-panel"

export default function GrievancePage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Grievance Redressal</PageHeaderHeading>
        <PageHeaderDescription>
          Multi-channel grievances with SLA-tracked, multi-tier escalation (Class Teacher → Principal → BEO → DEO →
          Secretariat) and CPGRAMS federation. Every action is written to the tamper-evident audit trail.
        </PageHeaderDescription>
      </PageHeader>
      <GrievancePanel />
    </Shell>
  )
}
