import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { IndentFormUI } from "./indent-form"

export default function NewIndentPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New Procurement Indent</PageHeaderHeading>
        <PageHeaderDescription>
          A goods indent under GFR 2017 / GeM: category, item, quantity, estimate and funding head. The purchase mode
          (direct GeM purchase ≤ ₹25,000; GeM bid ≤ ₹5 lakh; tender above) is chosen automatically, then routed
          Headmaster → BEO → DEO financial sanction → Directorate (tender), with a full audit trail.
        </PageHeaderDescription>
      </PageHeader>
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/procurement-approvals"><ArrowLeft className="mr-2 h-4 w-4" />Back to procurement inbox</Link>
        </Button>
      </div>
      <IndentFormUI />
    </Shell>
  )
}
