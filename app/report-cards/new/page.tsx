import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ReportCardForm } from "../components/reportcard-form"

export default function NewReportCardPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New Report Card</PageHeaderHeading>
        <PageHeaderDescription>Enter per-subject marks — the total, percentage, overall grade and Pass/Fail are computed automatically.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href="/report-cards"><ArrowLeft className="mr-2 h-4 w-4" />Back to report cards</Link></Button></div>
      <ReportCardForm />
    </Shell>
  )
}
