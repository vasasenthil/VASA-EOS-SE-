import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { LessonPlanForm } from "../components/lessonplan-form"

export default function NewLessonPlanPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New Lesson Plan</PageHeaderHeading>
        <PageHeaderDescription>Plan a class session — scheduling, topic, objectives, materials, homework, planner links and class notes.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href="/lesson-plans"><ArrowLeft className="mr-2 h-4 w-4" />Back to lesson plans</Link></Button></div>
      <LessonPlanForm />
    </Shell>
  )
}
