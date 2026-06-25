import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { TransferFormUI } from "./transfer-form"

export default function NewTransferPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New Teacher Transfer Request</PageHeaderHeading>
        <PageHeaderDescription>
          A counselling-based request governed by service rules: current and requested posting, reason, and years of
          service. Eligibility (priority grounds waive the minimum service) and inter-district detection are computed
          live, then it routes Headmaster NOC → BEO → DEO counselling → Directorate sanction (inter-district), with a
          full audit trail.
        </PageHeaderDescription>
      </PageHeader>
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/transfer-approvals"><ArrowLeft className="mr-2 h-4 w-4" />Back to transfer inbox</Link>
        </Button>
      </div>
      <TransferFormUI />
    </Shell>
  )
}
