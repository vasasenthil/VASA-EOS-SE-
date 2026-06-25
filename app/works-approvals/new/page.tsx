import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { WorksFormUI } from "./works-form"

export default function NewWorksPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New Infrastructure Works Proposal</PageHeaderHeading>
        <PageHeaderDescription>
          A capital civil-works proposal under Samagra Shiksha / PM SHRI: work type, estimated cost, funding source and
          justification. High-value works (≥ ₹10 lakh) route to the Directorate, and RTE/RPwD-mandated works are flagged
          priority — computed live, then routed Headmaster → Block AE → District EE/DEO → Directorate, with a full audit
          trail.
        </PageHeaderDescription>
      </PageHeader>
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/works-approvals"><ArrowLeft className="mr-2 h-4 w-4" />Back to works inbox</Link>
        </Button>
      </div>
      <WorksFormUI />
    </Shell>
  )
}
