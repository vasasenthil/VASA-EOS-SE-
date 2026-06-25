import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"
import Link from "next/link"
import { RtiApprovalBoard } from "./rti-approval-board"
import { listRtisAction } from "./actions"
import { getCurrentRole } from "@/lib/auth/current-role"

export const dynamic = "force-dynamic"

export default async function RtiApprovalsPage() {
  const [initial, role] = await Promise.all([listRtisAction(), getCurrentRole()])
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>RTI Requests (RTI Act 2005)</PageHeaderHeading>
        <PageHeaderDescription>
          A civic-transparency workflow: a citizen&apos;s RTI application is answered by the Public Information Officer;
          each tier may provide the information or the citizen may appeal — first to the First Appellate Authority, then
          to the State Information Commission — with a tamper-evident audit trail. Switch role to act at each tier.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild>
            <Link href="/rti-approvals/new"><FilePlus className="mr-2 h-4 w-4" />File an RTI</Link>
          </Button>
        </PageHeaderActions>
      </PageHeader>
      <RtiApprovalBoard initial={initial} sessionRole={role} />
    </Shell>
  )
}
