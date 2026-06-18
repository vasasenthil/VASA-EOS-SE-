import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ProposalForm } from "../components/proposal-form"

export default function NewProposalPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New Policy Proposal</PageHeaderHeading>
        <PageHeaderDescription>Set the baseline and coverage lever — the Policy Engine projects beneficiaries, cost and equity live; the authority sanctions.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href="/policy-simulator"><ArrowLeft className="mr-2 h-4 w-4" />Back to simulator</Link></Button></div>
      <ProposalForm />
    </Shell>
  )
}
