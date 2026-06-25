import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { RtiFormUI } from "./rti-form"

export default function NewRtiPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>File an RTI Application</PageHeaderHeading>
        <PageHeaderDescription>
          An application under the RTI Act 2005: subject, the specific information sought, and your status. The ₹10 fee
          is waived for BPL applicants (§7(5)), and requests concerning life or liberty are expedited to 48 hours
          (§7(1)) — computed live, then routed PIO → First Appellate Authority → State Information Commission, with a
          full audit trail.
        </PageHeaderDescription>
      </PageHeader>
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/rti-approvals"><ArrowLeft className="mr-2 h-4 w-4" />Back to RTI inbox</Link>
        </Button>
      </div>
      <RtiFormUI />
    </Shell>
  )
}
