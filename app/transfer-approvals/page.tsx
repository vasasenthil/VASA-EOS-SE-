import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"
import Link from "next/link"
import { TransferApprovalBoard } from "./transfer-approval-board"
import { listTransfersAction } from "./actions"
import { getCurrentRole } from "@/lib/auth/current-role"

export const dynamic = "force-dynamic"

export default async function TransferApprovalsPage() {
  const [initial, role] = await Promise.all([listTransfersAction(), getCurrentRole()])
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Teacher Transfer & Counselling</PageHeaderHeading>
        <PageHeaderDescription>
          A Roles &amp; Hierarchy / Staff workflow: a teacher&apos;s transfer request is cleared by the Headmaster
          (relieving NOC), recommended by the BEO, counselled and ordered by the District (DEO), and — for inter-district
          moves — sanctioned by the Directorate, with a tamper-evident audit trail. Switch role to act at each tier.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild>
            <Link href="/transfer-approvals/new"><FilePlus className="mr-2 h-4 w-4" />New transfer request</Link>
          </Button>
        </PageHeaderActions>
      </PageHeader>
      <TransferApprovalBoard initial={initial} sessionRole={role} />
    </Shell>
  )
}
