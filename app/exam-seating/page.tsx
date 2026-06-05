import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { SeatingPlanner } from "./seating-planner"

export default function ExamSeatingPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Exam Seating &amp; Halls</PageHeaderHeading>
        <PageHeaderDescription>
          Enter the candidate count and the planner allocates seats across exam halls by capacity, flagging any overflow
          that needs another session. Part of the examination-security workflow.
        </PageHeaderDescription>
      </PageHeader>
      <SeatingPlanner />
    </Shell>
  )
}
