import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { CompetitionsBoard } from "./competitions-board"
import { listEntriesAction } from "./actions"

export default async function CompetitionsPage() {
  const initial = await listEntriesAction()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Olympiad &amp; Competition Results</PageHeaderHeading>
        <PageHeaderDescription>
          Record student entries in olympiads and competitions by level and medal won, and tally the school&apos;s
          medal haul. Results feed each student&apos;s achievement portfolio and holistic progress card.
        </PageHeaderDescription>
      </PageHeader>
      <CompetitionsBoard initial={initial} />
    </Shell>
  )
}
