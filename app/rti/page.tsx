import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { RtiBoard } from "./rti-board"

export default function RtiPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>RTI Request Register</PageHeaderHeading>
        <PageHeaderDescription>
          Log Right to Information applications and track each through received → under process → replied against the
          30-day statutory deadline, with overdue applications flagged automatically.
        </PageHeaderDescription>
      </PageHeader>
      <RtiBoard />
    </Shell>
  )
}
