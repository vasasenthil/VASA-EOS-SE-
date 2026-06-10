import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { TicketFormUI } from "./ticket-form"

export default function NewTicketPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Raise a Maintenance Ticket</PageHeaderHeading>
        <PageHeaderDescription>
          A validated ticket, not a free note: a location, a category, a substantive fault description, who reported
          it, and a priority that must be consistent with any declared safety hazard. On submit it enters the
          three-step facilities workflow — Principal triages and assigns, the Vendor completes the work, the Principal
          verifies and closes — with a tamper-evident audit trail.
        </PageHeaderDescription>
      </PageHeader>
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/maintenance-approvals"><ArrowLeft className="mr-2 h-4 w-4" />Back to maintenance inbox</Link>
        </Button>
      </div>
      <TicketFormUI />
    </Shell>
  )
}
