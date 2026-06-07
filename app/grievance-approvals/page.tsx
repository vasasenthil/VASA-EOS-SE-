import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { GrievanceApprovalBoard } from "./grievance-approval-board"
import { listGrievanceFlowsAction } from "./actions"
import { getCurrentRole } from "@/lib/auth/current-role"

export default async function GrievanceApprovalsPage() {
  const [initial, role] = await Promise.all([listGrievanceFlowsAction(), getCurrentRole()])
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Grievance Redressal &amp; Escalation</PageHeaderHeading>
        <PageHeaderDescription>
          A tiered escalation workflow: each tier can <strong>Resolve</strong> the grievance or <strong>Escalate</strong>
          {" "}it to the next level — School (Principal) → Block (BEO) → District (DEO). Acts as your signed-in role, with
          a full audit trail and SLA-style visibility.
        </PageHeaderDescription>
      </PageHeader>
      <GrievanceApprovalBoard initial={initial} sessionRole={role} />
    </Shell>
  )
}
