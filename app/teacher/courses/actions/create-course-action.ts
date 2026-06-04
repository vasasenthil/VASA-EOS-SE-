"use server"

import { z } from "zod"
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/server"
import { getSupabaseAuthUser } from "@/lib/auth/server"
import { revalidatePath } from "next/cache"

const createCourseSchema = z.object({
  title: z.string().min(5, "Course title must be at least 5 characters long.").max(150),
  description: z.string().max(500, "Description cannot exceed 500 characters.").optional(),
})

export interface CreateCourseActionState {
  success: boolean
  message: string
  errors?: Partial<Record<keyof z.infer<typeof createCourseSchema> | "_general", string>> | null
  courseId?: string | null
}

export async function createCourseAction(
  values: z.infer<typeof createCourseSchema>,
): Promise<CreateCourseActionState> {
  if (!isSupabaseAdminConfigured()) {
    return {
      success: false,
      message: "Database client not configured.",
      errors: { _general: "Server configuration error." },
    }
  }

  const user = await getSupabaseAuthUser()
  const teacherId = user?.id
  if (!teacherId) {
    return {
      success: false,
      message: "Teacher information is missing.",
      errors: { _general: "Authentication or user data error." },
    }
  }

  const validatedFields = createCourseSchema.safeParse(values)

  if (!validatedFields.success) {
    const fieldErrors: Partial<Record<keyof z.infer<typeof createCourseSchema>, string>> = {}
    for (const issue of validatedFields.error.issues) {
      fieldErrors[issue.path[0] as keyof z.infer<typeof createCourseSchema>] = issue.message
    }
    return {
      success: false,
      message: "Validation failed. Please check the form fields.",
      errors: fieldErrors,
    }
  }

  const { title, description } = validatedFields.data

  try {
    const { data: newCourse, error: insertError } = await supabaseAdmin!
      .from("courses")
      .insert({
        title: title,
        description: description,
        teacher_id: teacherId,
      })
      .select("id") // Select the ID of the newly created course
      .single()

    if (insertError) {
      console.error("Error inserting course:", insertError)
      return {
        success: false,
        message: "Failed to create course in database.",
        errors: { _general: "Database insertion error." },
      }
    }

    if (!newCourse || !newCourse.id) {
      return {
        success: false,
        message: "Course created but ID not returned.",
        errors: { _general: "Database issue after course creation." },
      }
    }

    revalidatePath("/teacher/courses") // Revalidate the list of courses for the teacher
    revalidatePath(`/teacher/courses/create`) // Revalidate the create page itself (might not be necessary)

    return {
      success: true,
      message: `Course '${title}' created successfully.`,
      courseId: newCourse.id,
    }
  } catch (e: any) {
    console.error("Unexpected error creating course:", e)
    return {
      success: false,
      message: "An unexpected error occurred.",
      errors: { _general: "An unexpected server error occurred." },
    }
  }
}
