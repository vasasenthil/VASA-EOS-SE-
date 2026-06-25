import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getReportCardAction } from "../../actions"
import { ReportCardForm } from "../../components/reportcard-form"
import type { ReportCardInput } from "@/lib/reportcards"

export const dynamic = "force-dynamic"

export default async function EditReportCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = await getReportCardAction(id)

  if (!c) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Report card not found</CardTitle></CardHeader>
          <CardContent><Button asChild variant="outline" size="sm"><Link href="/report-cards"><ArrowLeft className="mr-2 h-4 w-4" />Back to report cards</Link></Button></CardContent>
        </Card>
      </Shell>
    )
  }

  const initial: ReportCardInput = {
    student: c.student, apaarId: c.apaarId, classLevel: c.classLevel, term: c.term,
    subjects: c.subjects, attendancePct: c.attendancePct, remarks: c.remarks, status: c.status,
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Edit report card — {c.student}</PageHeaderHeading>
        <PageHeaderDescription>Update marks, attendance or status. Totals and Pass/Fail recompute automatically. Changes are audited.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href={`/report-cards/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to report card</Link></Button></div>
      <ReportCardForm id={id} initial={initial} />
    </Shell>
  )
}
