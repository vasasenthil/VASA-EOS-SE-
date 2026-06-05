import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { VisitorDesk } from "./visitor-desk"

export default function VisitorsPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Visitor &amp; Gate Management</PageHeaderHeading>
        <PageHeaderDescription>
          Log visitor entry and check-out at the gate with purpose and host, and see who is currently on the premises —
          a basic safeguarding control (POCSO/safety).
        </PageHeaderDescription>
      </PageHeader>
      <VisitorDesk />
    </Shell>
  )
}
