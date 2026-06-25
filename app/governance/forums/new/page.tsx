import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ForumFormUI } from "./forum-form"

export default function NewForumResolutionPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Table a Governance Resolution</PageHeaderHeading>
        <PageHeaderDescription>
          A formal act of the State executive, not a free-text note: a forum, a category, a scheduled meeting date, a
          substantive resolution text, explicit RACI ownership (a Responsible driver and a single Accountable owner),
          an optional fund implication, and named action items. On submit it routes to Secretary adoption, a quorum of
          two Directors, and — for significant or high-value items — Minister ratification, with a tamper-evident
          audit trail.
        </PageHeaderDescription>
      </PageHeader>
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/governance/forums"><ArrowLeft className="mr-2 h-4 w-4" />Back to forums</Link>
        </Button>
      </div>
      <ForumFormUI />
    </Shell>
  )
}
