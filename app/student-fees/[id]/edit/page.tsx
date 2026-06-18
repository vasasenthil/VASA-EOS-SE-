import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getFeeAction } from "../../actions"
import { FeeForm } from "../../components/fee-form"
import type { FeeInput } from "@/lib/studentfees"

export const dynamic = "force-dynamic"

export default async function EditFeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await getFeeAction(id)

  if (!r) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Fee record not found</CardTitle></CardHeader>
          <CardContent><Button asChild variant="outline" size="sm"><Link href="/student-fees"><ArrowLeft className="mr-2 h-4 w-4" />Back to fees</Link></Button></CardContent>
        </Card>
      </Shell>
    )
  }

  const initial: FeeInput = {
    student: r.student, apaarId: r.apaarId, classLevel: r.classLevel, section: r.section, academicYear: r.academicYear,
    heads: r.heads, concessionType: r.concessionType, concessionAmount: r.concessionAmount, scholarshipScheme: r.scholarshipScheme,
    dbtReference: r.dbtReference, dueDate: r.dueDate, receipts: r.receipts, notes: r.notes,
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Edit fee record — {r.student}</PageHeaderHeading>
        <PageHeaderDescription>Update heads, concession/DBT linkage or record a receipt. Changes are audited.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href={`/student-fees/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to statement</Link></Button></div>
      <FeeForm id={id} initial={initial} />
    </Shell>
  )
}
