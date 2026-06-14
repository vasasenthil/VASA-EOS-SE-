import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { IncidentFormUI } from "./incident-form"

export default function NewIncidentPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Report a Child-Safety Incident</PageHeaderHeading>
        <PageHeaderDescription>
          A safeguarding report under POCSO 2012 / JJ Act: an anonymised case reference (no victim identity), category,
          severity, incident date (not in the future) and a factual account. Mandatory CWC/Police reporting (POCSO,
          critical) and escalation to the District Child Protection Unit are computed automatically, then routed
          Headmaster → Block safety → District, with a full audit trail.
        </PageHeaderDescription>
      </PageHeader>
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/safety-incidents"><ArrowLeft className="mr-2 h-4 w-4" />Back to incidents inbox</Link>
        </Button>
      </div>
      <IncidentFormUI />
    </Shell>
  )
}
