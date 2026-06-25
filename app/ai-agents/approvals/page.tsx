import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { ApprovalsBoard } from "./approvals-board"
import { listToolRequestsAction } from "./actions"

export const dynamic = "force-dynamic"

export default async function AgentApprovalsPage() {
  const initial = await listToolRequestsAction()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Agent Action Approvals (HITL)</PageHeaderHeading>
        <PageHeaderDescription>
          Side-effecting agent tool calls — DBT disbursement, compliance flags, IVR broadcasts — are held here until a
          human approves them. Approving runs the tool against its real seam; every decision is audited.
        </PageHeaderDescription>
      </PageHeader>
      <ApprovalsBoard initial={initial} />
    </Shell>
  )
}
