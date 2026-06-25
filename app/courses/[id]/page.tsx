import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil } from "lucide-react"
import { getCourseAction } from "../actions"
import { DeleteCourseButton } from "../components/delete-course-button"
import { safeDate } from "@/lib/format-date"

export const dynamic = "force-dynamic"

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const course = await getCourseAction(id)

  if (!course) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Course not found</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We couldn&apos;t find a course with this reference. It may have been removed.</p>
            <Button asChild variant="outline" size="sm"><Link href="/courses"><ArrowLeft className="mr-2 h-4 w-4" />Back to catalogue</Link></Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  const rows: Array<[string, string]> = [
    ["Code", course.code],
    ["Class", `Class ${course.classLevel}`],
    ["Subject area", course.subjectArea],
    ["Teacher", course.teacher],
    ["Credits", String(course.credits)],
    ["Created", safeDate(course.createdAt, "dd MMM yyyy")],
    ["Last updated", safeDate(course.updatedAt, "dd MMM yyyy")],
  ]

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>{course.name}</PageHeaderHeading>
        <PageHeaderDescription>{course.description}</PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline"><Link href={`/courses/${course.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit</Link></Button>
          <DeleteCourseButton id={course.id} name={course.name} redirectTo="/courses" />
        </PageHeaderActions>
      </PageHeader>
      <div className="mb-4 flex items-center gap-3">
        <Button asChild variant="outline" size="sm"><Link href="/courses"><ArrowLeft className="mr-2 h-4 w-4" />Back to catalogue</Link></Button>
        <Badge>{course.status}</Badge>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between border-b py-2 text-sm">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </Shell>
  )
}
