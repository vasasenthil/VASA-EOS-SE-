import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { SmcApprovalBoard } from "./smc-approval-board"
import { listResolutionsAction } from "./actions"
import { getCurrentRole } from "@/lib/auth/current-role"

export default async function SmcApprovalsPage() {
  const [initial, role] = await Promise.all([listResolutionsAction(), getCurrentRole()])
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>SMC Resolution Approvals</PageHeaderHeading>
        <PageHeaderDescription>
          A multiple-approver workflow: a School Management Committee resolution needs a quorum of 3 member approvals,
          then the Principal counter-signs. Switch role to act as an SMC member or the Principal.
        </PageHeaderDescription>
      </PageHeader>
      <SmcApprovalBoard initial={initial} sessionRole={role} />
    </Shell>
  )
}
