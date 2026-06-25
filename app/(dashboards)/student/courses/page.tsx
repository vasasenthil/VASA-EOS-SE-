import { PageHeader } from "@/components/page-header"
import { getEnrolledCourses } from "../actions/get-enrolled-courses"
import { CourseCard } from "../components/course-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

export default async function StudentCoursesPage() {
  const { courses, error, demo } = await getEnrolledCourses()

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="My Courses" description="Here are all the courses you are currently enrolled in." />
      {demo ? (
        <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Showing representative <strong>demo courses</strong> — sign in as a student to see your live enrolments.
        </div>
      ) : null}
      {courses && courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="mt-6 text-center text-gray-500">
          <p>You are not enrolled in any courses yet.</p>
        </div>
      )}
    </div>
  )
}
