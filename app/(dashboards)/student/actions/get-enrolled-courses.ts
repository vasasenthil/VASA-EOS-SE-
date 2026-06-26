"use server"

import { createClient, isSupabaseAdminConfigured, isDemoModeEnabled } from "@/lib/supabase/server"

export interface StudentCourse {
  id: string
  name: string
  description: string
}

// Representative courses shown in the credential-free walkthrough (no signed-in student),
// so the page is browseable instead of erroring — consistent with the demo fallbacks used by
// Policies / Schemes / NEP Tracking.
function demoCourses(): StudentCourse[] {
  return [
    { id: "demo-tamil", name: "Tamil", description: "Language, literature and composition (Std X)." },
    { id: "demo-english", name: "English", description: "Reading, grammar and communication skills." },
    { id: "demo-maths", name: "Mathematics", description: "Algebra, geometry and trigonometry per the TN SCERT syllabus." },
    { id: "demo-science", name: "Science", description: "Physics, chemistry and biology with practicals." },
    { id: "demo-social", name: "Social Science", description: "History, geography, civics and economics." },
    { id: "demo-cs", name: "Computer Science", description: "Foundations of computing and digital skills (Naan Mudhalvan)." },
  ]
}

export async function getEnrolledCourses(): Promise<{ courses?: StudentCourse[]; error?: string; demo?: boolean }> {
  // No database configured — show the representative walkthrough courses.
  if (isDemoModeEnabled()) {
    return { courses: demoCourses(), demo: true }
  }

  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // Not signed in (walkthrough / public browse) — show demo courses rather than an error.
    if (authError || !user) {
      return { courses: demoCourses(), demo: true }
    }

    // RLS policies ensure a user can only see their own enrollments.
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
      // Fail soft to demo so the page still renders.
      return { courses: demoCourses(), demo: true }
    }

    const courses = (data ?? []).map((enrollment: any) => ({ ...enrollment.courses })) as StudentCourse[]
    // An unseeded account shows the demo set so the page is never blank in a walkthrough.
    if (courses.length === 0) return { courses: demoCourses(), demo: true }
    return { courses }
  } catch (e) {
    console.error("getEnrolledCourses failed; returning demo:", e)
    return { courses: demoCourses(), demo: true }
  }
}
