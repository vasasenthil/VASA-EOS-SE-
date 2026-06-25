import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"
import Link from "next/link"
import { TcApprovalBoard } from "./tc-approval-board"
import { listTcsAction } from "./actions"
import { getCurrentRole } from "@/lib/auth/current-role"

export const dynamic = "force-dynamic"

export default async function TcApprovalsPage() {
  const [initial, role] = await Promise.all([listTcsAction(), getCurrentRole()])
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Transfer Certificate Issuance</PageHeaderHeading>
        <PageHeaderDescription>
          An Academic &amp; Assessment / Records workflow at the school tier: a leaving student&apos;s academic record is
          verified and dues cleared by the class teacher, the Headmaster issues and signs the TC against the
          student&apos;s APAAR id, and inter-state or duplicate (lost-original) certificates additionally need a Block
          (BEO) counter-signature — with a tamper-evident audit trail. Switch role to act at each tier.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild>
            <Link href="/tc-approvals/new"><FilePlus className="mr-2 h-4 w-4" />New TC request</Link>
          </Button>
        </PageHeaderActions>
      </PageHeader>
      <TcApprovalBoard initial={initial} sessionRole={role} />
    </Shell>
  )
}
