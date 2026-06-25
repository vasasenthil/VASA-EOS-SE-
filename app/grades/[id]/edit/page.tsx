import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getGradeAction } from "../../actions"
import { GradeForm } from "../../components/grade-form"
import type { GradeInput } from "@/lib/grades"

export const dynamic = "force-dynamic"

export default async function EditGradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const g = await getGradeAction(id)

  if (!g) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Grade not found</CardTitle></CardHeader>
          <CardContent><Button asChild variant="outline" size="sm"><Link href="/grades"><ArrowLeft className="mr-2 h-4 w-4" />Back to gradebook</Link></Button></CardContent>
        </Card>
      </Shell>
    )
  }

  const initial: GradeInput = {
    student: g.student, apaarId: g.apaarId, classLevel: g.classLevel, subject: g.subject,
    term: g.term, assessment: g.assessment, marks: g.marks, maxMarks: g.maxMarks, status: g.status,
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Edit grade — {g.student}</PageHeaderHeading>
        <PageHeaderDescription>Update the marks or status. Changes are audited.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href={`/grades/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to grade</Link></Button></div>
      <GradeForm id={id} initial={initial} />
    </Shell>
  )
}
