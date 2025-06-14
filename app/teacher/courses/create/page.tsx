import { CreateCourseForm } from "@/app/teacher/courses/components/create-course-form"
import { getUserIdFromAction, getUserRoleAndSchool } from "@/lib/auth/server" // Assuming getUserRoleAndSchool exists
import { redirect } from "next/navigation"

export default async function CreateCoursePage() {
  const userId = await getUserIdFromAction()
  if (!userId) {
    redirect("/login") // Or your login page
  }

  const userDetails = await getUserRoleAndSchool(userId)
  if (userDetails?.role !== "TEACHER") {
    // Or a more appropriate unauthorized page
    return (
      <div className="container mx-auto p-8 text-center">
        <p className="text-red-500">Access Denied: You must be a teacher to create courses.</p>
      </div>
    )
  }

  // The teacherId will be passed to the form/action implicitly or explicitly
  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <CreateCourseForm teacherId={userId} />
      </div>
    </main>
  )
}
