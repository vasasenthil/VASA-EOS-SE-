import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { LessonPlanner } from "./lesson-planner"

export default function LessonPlansPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Lesson Planning</PageHeaderHeading>
        <PageHeaderDescription>
          Capture NCF 2023-aligned lesson plans — subject, class, topic, objectives, materials and date. Each plan shows
          a completeness score so it&apos;s classroom-ready before delivery.
        </PageHeaderDescription>
      </PageHeader>
      <LessonPlanner />
    </Shell>
  )
}
