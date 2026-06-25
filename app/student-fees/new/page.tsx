import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { FeeForm } from "../components/fee-form"

export default function NewFeePage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New Fee Record</PageHeaderHeading>
        <PageHeaderDescription>Set the fee heads, any concession/DBT linkage and record receipts — the net demand, balance and status compute automatically.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href="/student-fees"><ArrowLeft className="mr-2 h-4 w-4" />Back to fees</Link></Button></div>
      <FeeForm />
    </Shell>
  )
}
