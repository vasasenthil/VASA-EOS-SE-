import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"
import Link from "next/link"
import { ProcurementApprovalBoard } from "./procurement-approval-board"
import { listIndentsAction } from "./actions"
import { getCurrentRole } from "@/lib/auth/current-role"

export const dynamic = "force-dynamic"

export default async function ProcurementApprovalsPage() {
  const [initial, role] = await Promise.all([listIndentsAction(), getCurrentRole()])
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>GeM Procurement Sanction</PageHeaderHeading>
        <PageHeaderDescription>
          A Schemes &amp; Welfare / procurement workflow: a school&apos;s goods indent is estimated by the Headmaster,
          verified at the block, financially sanctioned at the district, and — for high-value tenders (≥ ₹5 lakh) —
          approved by the Directorate, with the GeM/GFR purchase mode chosen automatically and a tamper-evident audit
          trail. Switch role to act at each tier.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild>
            <Link href="/procurement-approvals/new"><FilePlus className="mr-2 h-4 w-4" />New indent</Link>
          </Button>
        </PageHeaderActions>
      </PageHeader>
      <ProcurementApprovalBoard initial={initial} sessionRole={role} />
    </Shell>
  )
}
