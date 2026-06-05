import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { DrillsBoard } from "./drills-board"

export default function MockDrillsPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Fire &amp; Mock Drill Log</PageHeaderHeading>
        <PageHeaderDescription>
          Record fire, earthquake and other evacuation drills with their evacuation time, and track how many meet the
          NDMA target. Slow drills flag routes that need review — part of school disaster preparedness.
        </PageHeaderDescription>
      </PageHeader>
      <DrillsBoard />
    </Shell>
  )
}
