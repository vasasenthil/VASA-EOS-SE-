import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { ReadingBoard } from "./reading-board"

export default function ReadingPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Reading Campaign &amp; FLN Levels</PageHeaderHeading>
        <PageHeaderDescription>
          Track each child&apos;s foundational reading band (NIPUN Bharat / ASER) from Beginner to reading a full Story,
          log books read, and watch the class fluency rate climb toward the NIPUN goal.
        </PageHeaderDescription>
      </PageHeader>
      <ReadingBoard />
    </Shell>
  )
}
