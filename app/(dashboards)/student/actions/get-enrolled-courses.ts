"use server"

import { createClient } from "@/lib/supabase/server"

export async function getEnrolledCourses() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error("Error fetching user:", authError)
    return { error: "User not found. Please log in again." }
  }

  // RLS policies ensure a user can only see their own enrollments.
  // We join enrollments with courses to get course details.
  const { data, error } = await supabase
    .from("enrollments")
    .select(
      `
      id: course_id,
      courses (
        id,
        name,
        description
      )
    `,
    )
    .eq("user_id", user.id)

  if (error) {
    console.error("Error fetching enrolled courses:", error)
    return { error: "Could not fetch enrolled courses." }
  }

  // The data is nested, so we need to flatten it for easier use in the UI.
  const courses = data.map((enrollment: any) => ({
    ...enrollment.courses,
  }))

  return { courses }
}
