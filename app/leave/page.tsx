import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { LeaveBoard } from "./leave-board"
import { listLeaveAction } from "./actions"

export default async function LeavePage() {
  const initial = await listLeaveAction()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Leave Management</PageHeaderHeading>
        <PageHeaderDescription>
          Teachers apply for casual / medical / earned / maternity leave; approvers act on requests. Approved leave is the
          trigger for the timetable substitution planner.
        </PageHeaderDescription>
      </PageHeader>
      <LeaveBoard initial={initial} />
    </Shell>
  )
}
