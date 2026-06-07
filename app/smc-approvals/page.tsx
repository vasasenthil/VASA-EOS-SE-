import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { SmcApprovalBoard } from "./smc-approval-board"
import { listResolutionsAction } from "./actions"

export default async function SmcApprovalsPage() {
  const initial = await listResolutionsAction()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>SMC Resolution Approvals</PageHeaderHeading>
        <PageHeaderDescription>
          A multiple-approver workflow: a School Management Committee resolution needs a quorum of 3 member approvals,
          then the Principal counter-signs. Switch role to act as an SMC member or the Principal.
        </PageHeaderDescription>
      </PageHeader>
      <SmcApprovalBoard initial={initial} />
    </Shell>
  )
}
