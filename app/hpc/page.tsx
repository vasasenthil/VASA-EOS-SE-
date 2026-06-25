import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { HpcCard } from "./hpc-card"

export default function HpcPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Holistic Progress Card</PageHeaderHeading>
        <PageHeaderDescription>
          NEP-aligned holistic reporting — enter a student&apos;s subject marks and the card computes grades (8-point
          band), CGPA, percentage and a narrative descriptor live.
        </PageHeaderDescription>
      </PageHeader>
      <HpcCard />
    </Shell>
  )
}
