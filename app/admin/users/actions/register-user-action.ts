"use server"

import { z } from "zod"
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/server" // Assuming you have this for admin actions
// import { hash } from 'bcryptjs'; // Or any other password hashing library

// Placeholder for password hashing - in a real app, use a strong hashing library like bcrypt or argon2
// For Next.js/Supabase, Supabase handles password hashing automatically if you pass the raw password to auth.signUp
// However, if creating users directly in a 'users' table outside of Supabase Auth, you'd need to hash.
// For this MVP, we'll assume direct insertion into our custom 'users' table and will need to hash.
// A simple placeholder for now, **REPLACE WITH ACTUAL HASHING**
async function hashPassword(password: string): Promise<string> {
  // In a real app, use bcryptjs or argon2id
  // const salt = await genSalt(10);
  // return await hash(password, salt);
  console.warn("Using placeholder password hashing. REPLACE in production.")
  return `hashed_${password}` // DO NOT USE IN PRODUCTION
}

const registerUserSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters long."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
  role: z.enum(["STUDENT", "TEACHER"], { message: "Invalid role selected." }),
})

export interface RegisterUserActionState {
  success: boolean
  message: string
  errors?: Partial<Record<keyof z.infer<typeof registerUserSchema> | "_general", string>> | null
}

export async function registerUserAction(
  schoolId: string, // Passed from the form component, representing the admin's school
  prevState: RegisterUserActionState,
  formData: FormData,
): Promise<RegisterUserActionState> {
  if (!isSupabaseAdminConfigured()) {
    return {
      success: false,
      message: "Database client not configured.",
      errors: { _general: "Server configuration error." },
    }
  }

  const validatedFields = registerUserSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  })

  if (!validatedFields.success) {
    const fieldErrors: Partial<Record<keyof z.infer<typeof registerUserSchema>, string>> = {}
    for (const issue of validatedFields.error.issues) {
      fieldErrors[issue.path[0] as keyof z.infer<typeof registerUserSchema>] = issue.message
    }
    return {
      success: false,
      message: "Validation failed. Please check the form fields.",
      errors: fieldErrors,
    }
  }

  const { fullName, email, password, role } = validatedFields.data

  try {
    // Check if email already exists
    const { data: existingUser, error: fetchError } = await supabaseAdmin!
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (fetchError) {
      console.error("Error checking existing user:", fetchError)
      return { success: false, message: "Database error checking user.", errors: { _general: "Database error." } }
    }

    if (existingUser) {
      return {
        success: false,
        message: "An account with this email already exists.",
        errors: { email: "Email already in use." },
      }
    }

    const hashedPassword = await hashPassword(password) // **REPLACE WITH SECURE HASHING**

    const { error: insertError } = await supabaseAdmin!.from("users").insert({
      full_name: fullName,
      email: email,
      password_hash: hashedPassword, // Store the hashed password
      role: role,
      school_id: schoolId, // Associate with the admin's school
    })

    if (insertError) {
      console.error("Error inserting user:", insertError)
      return {
        success: false,
        message: "Failed to create user in database.",
        errors: { _general: "Database insertion error." },
      }
    }

    // Revalidate relevant paths if needed, e.g., revalidatePath('/admin/users')
    return {
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()} '${fullName}' created successfully.`,
    }
  } catch (e: any) {
    console.error("Unexpected error creating user:", e)
    return {
      success: false,
      message: "An unexpected error occurred.",
      errors: { _general: "An unexpected server error occurred." },
    }
  }
}
