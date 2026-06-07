import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { RecognitionApprovalBoard } from "./recognition-approval-board"
import { listRecognitionsAction } from "./actions"

export default async function RecognitionApprovalsPage() {
  const initial = await listRecognitionsAction()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>School Recognition Approvals (TN 1973)</PageHeaderHeading>
        <PageHeaderDescription>
          A three-level sequential workflow: Block verification (BEO) → District scrutiny (DEO) → Directorate sanction
          (Director). Switch role to act at each tier and watch the application progress with a full audit trail.
        </PageHeaderDescription>
      </PageHeader>
      <RecognitionApprovalBoard initial={initial} />
    </Shell>
  )
}
