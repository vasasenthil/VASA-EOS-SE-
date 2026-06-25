import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getCoverAction } from "../../actions"
import { CoverForm } from "../../components/cover-form"
import type { CoverInput } from "@/lib/coverflow"

export const dynamic = "force-dynamic"

export default async function EditCoverPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = await getCoverAction(id)

  if (!c) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Cover arrangement not found</CardTitle></CardHeader>
          <CardContent><Button asChild variant="outline" size="sm"><Link href="/cover-arrangements"><ArrowLeft className="mr-2 h-4 w-4" />Back to arrangements</Link></Button></CardContent>
        </Card>
      </Shell>
    )
  }

  const initial: CoverInput = {
    date: c.date, absentTeacher: c.absentTeacher, reason: c.reason, classLevel: c.classLevel, section: c.section,
    period: c.period, subject: c.subject, substituteTeacher: c.substituteTeacher, status: c.status, notes: c.notes,
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Edit cover · {c.absentTeacher} P{c.period}</PageHeaderHeading>
        <PageHeaderDescription>Update the arrangement. Use <em>Suggest free teachers</em> to assign a substitute free in this slot. Changes are audited.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href={`/cover-arrangements/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to arrangement</Link></Button></div>
      <CoverForm id={id} initial={initial} />
    </Shell>
  )
}
