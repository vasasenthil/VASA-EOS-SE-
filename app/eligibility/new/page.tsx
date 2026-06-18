import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { EligibilityForm } from "../components/eligibility-form"

export default function NewEligibilityPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New Eligibility / Compliance Case</PageHeaderHeading>
        <PageHeaderDescription>Choose a rule set and enter the facts — the Reasoning Engine derives the conclusions live; an officer decides.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href="/eligibility"><ArrowLeft className="mr-2 h-4 w-4" />Back to cases</Link></Button></div>
      <EligibilityForm />
    </Shell>
  )
}
