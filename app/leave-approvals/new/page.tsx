import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { LeaveFormUI } from "./leave-form"

export default function NewLeavePage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Apply for Leave</PageHeaderHeading>
        <PageHeaderDescription>
          A validated leave request — the dates must form a valid range, the duration is computed for you, and a
          medical leave beyond two days requires a certificate. On submit it enters the three-tier approval workflow
          (Principal → BEO → DEO) with a tamper-evident audit trail.
        </PageHeaderDescription>
      </PageHeader>
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/leave-approvals"><ArrowLeft className="mr-2 h-4 w-4" />Back to leave inbox</Link>
        </Button>
      </div>
      <LeaveFormUI />
    </Shell>
  )
}
