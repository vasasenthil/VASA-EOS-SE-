import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"
import Link from "next/link"
import { BudgetApprovalBoard } from "./budget-approval-board"
import { listBudgetsAction } from "./actions"
import { getCurrentRole } from "@/lib/auth/current-role"

export const dynamic = "force-dynamic"

export default async function BudgetApprovalsPage() {
  const [initial, role] = await Promise.all([listBudgetsAction(), getCurrentRole()])
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Budget Sanction &amp; Re-appropriation</PageHeaderHeading>
        <PageHeaderDescription>
          A Policy &amp; Governance (Finance) workflow at the State tier: the Directorate proposes a fresh sanction,
          re-appropriation or supplementary grant; the Secretariat &amp; Finance Department scrutinise it; and new
          schemes or high-value proposals (≥ ₹50 crore) are routed to the Cabinet / Minister — with a tamper-evident
          audit trail. Switch role to act at each tier.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild>
            <Link href="/budget-approvals/new"><FilePlus className="mr-2 h-4 w-4" />New proposal</Link>
          </Button>
        </PageHeaderActions>
      </PageHeader>
      <BudgetApprovalBoard initial={initial} sessionRole={role} />
    </Shell>
  )
}
