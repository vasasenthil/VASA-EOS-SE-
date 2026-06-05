import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { CompetitionsBoard } from "./competitions-board"

export default function CompetitionsPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Olympiad &amp; Competition Results</PageHeaderHeading>
        <PageHeaderDescription>
          Record student entries in olympiads and competitions by level and medal won, and tally the school&apos;s
          medal haul. Results feed each student&apos;s achievement portfolio and holistic progress card.
        </PageHeaderDescription>
      </PageHeader>
      <CompetitionsBoard />
    </Shell>
  )
}
