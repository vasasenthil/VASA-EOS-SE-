import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { RtiBoard } from "./rti-board"
import { listRtiAction } from "./actions"

export default async function RtiPage() {
  const initial = await listRtiAction()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>RTI Request Register</PageHeaderHeading>
        <PageHeaderDescription>
          Log Right to Information applications and track each through received → under process → replied against the
          30-day statutory deadline, with overdue applications flagged automatically.
        </PageHeaderDescription>
      </PageHeader>
      <RtiBoard initial={initial} />
    </Shell>
  )
}
