import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getLessonPlanAction } from "../../actions"
import { LessonPlanForm } from "../../components/lessonplan-form"
import type { LessonPlanInput } from "@/lib/lessonplans"

export const dynamic = "force-dynamic"

export default async function EditLessonPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await getLessonPlanAction(id)

  if (!p) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Lesson plan not found</CardTitle></CardHeader>
          <CardContent><Button asChild variant="outline" size="sm"><Link href="/lesson-plans"><ArrowLeft className="mr-2 h-4 w-4" />Back to lesson plans</Link></Button></CardContent>
        </Card>
      </Shell>
    )
  }

  const initial: LessonPlanInput = {
    classLevel: p.classLevel, section: p.section, subject: p.subject, teacher: p.teacher, date: p.date, period: p.period,
    startTime: p.startTime, endTime: p.endTime, lessonType: p.lessonType, topic: p.topic, objectives: p.objectives,
    previousTopics: p.previousTopics, furtherTopics: p.furtherTopics, materialsToBring: p.materialsToBring,
    homework: p.homework, lessonPlannerLink: p.lessonPlannerLink, classNotes: p.classNotes, status: p.status,
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Edit lesson plan — {p.topic}</PageHeaderHeading>
        <PageHeaderDescription>Update the plan. Changes are audited.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href={`/lesson-plans/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to lesson plan</Link></Button></div>
      <LessonPlanForm id={id} initial={initial} />
    </Shell>
  )
}
