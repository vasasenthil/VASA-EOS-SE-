import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { WaterBoard } from "./water-board"

export default function WaterQualityPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Drinking Water &amp; Sanitation Quality</PageHeaderHeading>
        <PageHeaderDescription>
          Log periodic water-quality tests by source — pH is checked against the IS 10500 safe range and the result is
          recorded safe/unsafe. Part of the Swachh Vidyalaya / WASH compliance loop.
        </PageHeaderDescription>
      </PageHeader>
      <WaterBoard />
    </Shell>
  )
}
