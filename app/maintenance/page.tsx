import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { MaintenanceBoard } from "./maintenance-board"

export default function MaintenancePage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Maintenance Tickets</PageHeaderHeading>
        <PageHeaderDescription>
          Raise and track infrastructure works — electrical, plumbing, furniture, building, IT and sanitation — through
          open → in progress → resolved, with priority and a high-priority backlog indicator.
        </PageHeaderDescription>
      </PageHeader>
      <MaintenanceBoard />
    </Shell>
  )
}
