import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { SportsBoard } from "./sports-board"
import { listResultsAction } from "./actions"

export default async function SportsPage() {
  const initial = await listResultsAction()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Sports Meet &amp; Medal Tally</PageHeaderHeading>
        <PageHeaderDescription>
          Record results across athletics and games events (Khelo India) and watch the medal tally and points build up
          live — the basis for talent identification and school sports recognition.
        </PageHeaderDescription>
      </PageHeader>
      <SportsBoard initial={initial} />
    </Shell>
  )
}
