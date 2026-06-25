import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"
import Link from "next/link"
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
        <PageHeaderActions>
          <Button asChild>
            <Link href="/smc-approvals/new"><FilePlus className="mr-2 h-4 w-4" />Propose a resolution</Link>
          </Button>
        </PageHeaderActions>
      </PageHeader>
      <SmcApprovalBoard initial={initial} sessionRole={role} />
    </Shell>
  )
}
