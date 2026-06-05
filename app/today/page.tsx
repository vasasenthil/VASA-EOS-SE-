import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { TodayLoop } from "./today-loop"

export default function TodayPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Today</PageHeaderHeading>
        <PageHeaderDescription>
          The teacher&apos;s daily 60-second loop — one screen that turns your class&apos;s live attendance, at-risk and
          NIPUN signals into a short, prioritised checklist. Clear it to build your streak.
        </PageHeaderDescription>
      </PageHeader>
      <TodayLoop />
    </Shell>
  )
}
