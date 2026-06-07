import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { RecognitionApprovalBoard } from "./recognition-approval-board"
import { listRecognitionsAction } from "./actions"
import { getCurrentRole } from "@/lib/auth/current-role"

export default async function RecognitionApprovalsPage() {
  const [initial, role] = await Promise.all([listRecognitionsAction(), getCurrentRole()])
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>School Recognition Approvals (TN 1973)</PageHeaderHeading>
        <PageHeaderDescription>
          A three-level sequential workflow: Block verification (BEO) → District scrutiny (DEO) → Directorate sanction
          (Director). Switch role to act at each tier and watch the application progress with a full audit trail.
        </PageHeaderDescription>
      </PageHeader>
      <RecognitionApprovalBoard initial={initial} sessionRole={role} />
    </Shell>
  )
}
