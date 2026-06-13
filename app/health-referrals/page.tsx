import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"
import Link from "next/link"
import { HealthReferralBoard } from "./health-referral-board"
import { listReferralsAction } from "./actions"
import { getCurrentRole } from "@/lib/auth/current-role"

export const dynamic = "force-dynamic"

export default async function HealthReferralsPage() {
  const [initial, role] = await Promise.all([listReferralsAction(), getCurrentRole()])
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>RBSK Health Referrals</PageHeaderHeading>
        <PageHeaderDescription>
          A Health, Safety &amp; Welfare workflow: a school health screening (the RBSK 4 Ds) is triaged and verified by
          the Headmaster, reviewed by the Block Medical Officer, and — for cases needing specialist care — referred to
          the District Early-Intervention Centre, with a tamper-evident audit trail. Switch role to act at each tier.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild>
            <Link href="/health-referrals/new"><FilePlus className="mr-2 h-4 w-4" />New referral</Link>
          </Button>
        </PageHeaderActions>
      </PageHeader>
      <HealthReferralBoard initial={initial} sessionRole={role} />
    </Shell>
  )
}
