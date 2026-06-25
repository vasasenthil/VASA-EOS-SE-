import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ResolutionFormUI } from "./resolution-form"

export default function NewResolutionPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Propose an SMC Resolution</PageHeaderHeading>
        <PageHeaderDescription>
          A governance act under RTE §21, not a free-text note: a category, a meeting date that cannot be in the
          future, a substantive resolution text, and a proposer and seconder who must be different members, with the
          quorum present. On submit it routes to a 3-member quorum approval, then the Principal counter-signs, with a
          tamper-evident audit trail.
        </PageHeaderDescription>
      </PageHeader>
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/smc-approvals"><ArrowLeft className="mr-2 h-4 w-4" />Back to SMC inbox</Link>
        </Button>
      </div>
      <ResolutionFormUI />
    </Shell>
  )
}
