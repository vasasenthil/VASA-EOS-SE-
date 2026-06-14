import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"
import Link from "next/link"
import { WorksApprovalBoard } from "./works-approval-board"
import { listWorksAction } from "./actions"
import { getCurrentRole } from "@/lib/auth/current-role"

export const dynamic = "force-dynamic"

export default async function WorksApprovalsPage() {
  const [initial, role] = await Promise.all([listWorksAction(), getCurrentRole()])
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Infrastructure Works Sanction</PageHeaderHeading>
        <PageHeaderDescription>
          An Infrastructure &amp; Records workflow: a school&apos;s civil-works proposal (new classroom, toilet block,
          ramp, drinking water…) is estimated by the Headmaster, technically scrutinised at the block, sanctioned at the
          district, and — for high-value works (≥ ₹10 lakh) — approved by the Directorate, with a tamper-evident audit
          trail. Switch role to act at each tier.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild>
            <Link href="/works-approvals/new"><FilePlus className="mr-2 h-4 w-4" />New works proposal</Link>
          </Button>
        </PageHeaderActions>
      </PageHeader>
      <WorksApprovalBoard initial={initial} sessionRole={role} />
    </Shell>
  )
}
