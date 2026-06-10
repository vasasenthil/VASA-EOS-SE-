import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"
import Link from "next/link"
import { LeaveApprovalBoard } from "./leave-approval-board"
import { listLeaveFlowsAction } from "./actions"
import { getCurrentRole } from "@/lib/auth/current-role"

export default async function LeaveApprovalsPage() {
  const [initial, role] = await Promise.all([listLeaveFlowsAction(), getCurrentRole()])
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Leave Approval Workflow</PageHeaderHeading>
        <PageHeaderDescription>
          An end-to-end, multi-level approval flow driven by the workflow engine: the Principal always approves; leave
          over 5 days also routes to the BEO; over 15 days also to the DEO. Switch the approver role to see each
          inbox, act on requests, and watch the audit trail build.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild>
            <Link href="/leave-approvals/new"><FilePlus className="mr-2 h-4 w-4" />Apply for leave</Link>
          </Button>
        </PageHeaderActions>
      </PageHeader>
      <LeaveApprovalBoard initial={initial} sessionRole={role} />
    </Shell>
  )
}
