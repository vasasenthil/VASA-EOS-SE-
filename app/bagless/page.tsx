import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { BaglessBoard } from "./bagless-board"
import { listActivitiesAction } from "./actions"

export default async function BaglessPage() {
  const initial = await listActivitiesAction()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Bagless Days &amp; Experiential Learning</PageHeaderHeading>
        <PageHeaderDescription>
          Log hands-on, experiential activities — local crafts, field visits, kitchen gardening — and track progress
          toward the NEP 2020 target of 10 bagless days a year.
        </PageHeaderDescription>
      </PageHeader>
      <BaglessBoard initial={initial} />
    </Shell>
  )
}
