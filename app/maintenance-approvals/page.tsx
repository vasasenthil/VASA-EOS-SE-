import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"
import Link from "next/link"
import { MaintenanceApprovalBoard } from "./maintenance-approval-board"
import { listTicketFlowsAction } from "./actions"
import { getCurrentRole } from "@/lib/auth/current-role"

export default async function MaintenanceApprovalsPage() {
  const [initial, role] = await Promise.all([listTicketFlowsAction(), getCurrentRole()])
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Maintenance Tickets (Workflow)</PageHeaderHeading>
        <PageHeaderDescription>
          A role-gated works flow on the engine: the Principal triages &amp; assigns → the Vendor completes the work →
          the Principal verifies &amp; closes. Acts as your signed-in role, with a full audit trail.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild>
            <Link href="/maintenance-approvals/new"><FilePlus className="mr-2 h-4 w-4" />Raise a ticket</Link>
          </Button>
        </PageHeaderActions>
      </PageHeader>
      <MaintenanceApprovalBoard initial={initial} sessionRole={role} />
    </Shell>
  )
}
