import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { LoanForm } from "../components/loan-form"

export default function NewLoanPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Issue a Book</PageHeaderHeading>
        <PageHeaderDescription>Record a loan — book copy, member, due date and fine policy. Status and fine compute automatically.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href="/library-circulation"><ArrowLeft className="mr-2 h-4 w-4" />Back to circulation</Link></Button></div>
      <LoanForm />
    </Shell>
  )
}
