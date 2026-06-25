import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ScholarshipFormUI } from "./scholarship-form"

export default function NewScholarshipPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New Scholarship / Benefit Application</PageHeaderHeading>
        <PageHeaderDescription>
          A rule-governed welfare application — scheme, social category, income, attendance and a DBT bank account.
          Eligibility is derived live by the Reasoning engine (so the rule that applies is explainable), then it routes
          through Headmaster verification → BEO sanction → DEO scrutiny (≥ ₹25,000) → DBT release, with a full audit
          trail.
        </PageHeaderDescription>
      </PageHeader>
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/scholarship-approvals"><ArrowLeft className="mr-2 h-4 w-4" />Back to sanction inbox</Link>
        </Button>
      </div>
      <ScholarshipFormUI />
    </Shell>
  )
}
