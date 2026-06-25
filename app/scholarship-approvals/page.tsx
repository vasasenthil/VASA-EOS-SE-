import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"
import Link from "next/link"
import { ScholarshipApprovalBoard } from "./scholarship-approval-board"
import { listScholarshipsAction } from "./actions"
import { getCurrentRole } from "@/lib/auth/current-role"

export const dynamic = "force-dynamic"

export default async function ScholarshipApprovalsPage() {
  const [initial, role] = await Promise.all([listScholarshipsAction(), getCurrentRole()])
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Scholarship / Benefit Sanction</PageHeaderHeading>
        <PageHeaderDescription>
          A Schemes &amp; Welfare workflow: a benefit application is checked for AI eligibility (Reasoning engine),
          verified by the Headmaster, sanctioned by the BEO, scrutinised by the DEO for high-value sanctions, and
          released as a DBT — with a tamper-evident audit trail. Switch role to act at each tier.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild>
            <Link href="/scholarship-approvals/new"><FilePlus className="mr-2 h-4 w-4" />New application</Link>
          </Button>
        </PageHeaderActions>
      </PageHeader>
      <ScholarshipApprovalBoard initial={initial} sessionRole={role} />
    </Shell>
  )
}
