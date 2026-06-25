import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"
import Link from "next/link"
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
        <PageHeaderActions>
          <Button asChild>
            <Link href="/recognition-approvals/new"><FilePlus className="mr-2 h-4 w-4" />File full application</Link>
          </Button>
        </PageHeaderActions>
      </PageHeader>
      <RecognitionApprovalBoard initial={initial} sessionRole={role} />
    </Shell>
  )
}
