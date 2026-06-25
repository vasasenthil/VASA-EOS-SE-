import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getAssignmentAction } from "../../actions"
import { AssignmentForm } from "../../components/assignment-form"
import type { AssignmentInput } from "@/lib/assignments"

export const dynamic = "force-dynamic"

export default async function EditAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const a = await getAssignmentAction(id)

  if (!a) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Assignment not found</CardTitle></CardHeader>
          <CardContent><Button asChild variant="outline" size="sm"><Link href="/assignments"><ArrowLeft className="mr-2 h-4 w-4" />Back to assignments</Link></Button></CardContent>
        </Card>
      </Shell>
    )
  }

  const initial: AssignmentInput = {
    title: a.title, classLevel: a.classLevel, subject: a.subject, type: a.type,
    dueDate: a.dueDate, maxMarks: a.maxMarks, instructions: a.instructions, teacher: a.teacher, status: a.status,
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Edit {a.title}</PageHeaderHeading>
        <PageHeaderDescription>Update the assignment. Changes are audited.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href={`/assignments/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to assignment</Link></Button></div>
      <AssignmentForm id={id} initial={initial} />
    </Shell>
  )
}
