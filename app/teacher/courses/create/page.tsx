import CreateCourseForm from "../components/create-course-form"
import { PageHeader } from "@/components/page-header"

export default function CreateCoursePage() {
  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Create New Course"
        description="Fill out the form below to create a new course for your students."
      />
      <div className="mt-8 max-w-2xl">
        <CreateCourseForm />
      </div>
    </div>
  )
}
