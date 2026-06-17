import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getCourseAction } from "../../actions"
import { CourseForm } from "../../components/course-form"
import type { CourseInput } from "@/lib/courses"

export const dynamic = "force-dynamic"

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const course = await getCourseAction(id)

  if (!course) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Course not found</CardTitle></CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm"><Link href="/courses"><ArrowLeft className="mr-2 h-4 w-4" />Back to catalogue</Link></Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  const initial: CourseInput = {
    code: course.code,
    name: course.name,
    classLevel: course.classLevel,
    subjectArea: course.subjectArea,
    description: course.description,
    credits: course.credits,
    teacher: course.teacher,
    status: course.status,
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Edit {course.name}</PageHeaderHeading>
        <PageHeaderDescription>Update the course details. Changes are audited.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4">
        <Button asChild variant="outline" size="sm"><Link href={`/courses/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to course</Link></Button>
      </div>
      <CourseForm id={id} initial={initial} />
    </Shell>
  )
}
