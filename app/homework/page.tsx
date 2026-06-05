import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { HomeworkBoard } from "./homework-board"

export default function HomeworkPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Homework &amp; Assignments</PageHeaderHeading>
        <PageHeaderDescription>
          Assign homework, then move it through submitted → graded. Overdue items (assigned past their due date) are
          flagged for follow-up.
        </PageHeaderDescription>
      </PageHeader>
      <HomeworkBoard />
    </Shell>
  )
}
