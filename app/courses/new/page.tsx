import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { CourseForm } from "../components/course-form"

export default function NewCoursePage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New Course</PageHeaderHeading>
        <PageHeaderDescription>Add a course to the catalogue — code, class, subject area, teacher, credits and status.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4">
        <Button asChild variant="outline" size="sm"><Link href="/courses"><ArrowLeft className="mr-2 h-4 w-4" />Back to catalogue</Link></Button>
      </div>
      <CourseForm />
    </Shell>
  )
}
