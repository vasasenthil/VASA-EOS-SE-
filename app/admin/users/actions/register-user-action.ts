"use server"

import { z } from "zod"
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { syncUserToBackbone } from "@/lib/access/backbone-sync"
import { logger } from "@/lib/logger"

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
  schoolId: string,
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
    // Step 1: Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin!.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email for simplicity in MVP by admin
      user_metadata: {
        full_name: fullName,
        // You can add role here if you want it in auth.users.raw_user_meta_data
        // initial_role: role,
      },
    })

    if (authError) {
      console.error("Supabase Auth error creating user:", authError)
      // Check for common errors like email already exists
      if (authError.message.includes("already registered")) {
        return {
          success: false,
          message: "This email is already registered.",
          errors: { email: "Email already in use." },
        }
      }
      return {
        success: false,
        message: `Failed to create user account: ${authError.message}`,
        errors: { _general: "Authentication service error." },
      }
    }

    if (!authUser || !authUser.user) {
      return {
        success: false,
        message: "User account created but no user data returned.",
        errors: { _general: "Authentication service issue." },
      }
    }

    // Step 2: Insert into our custom 'users' table, linking to the Auth user
    const { error: profileInsertError } = await supabaseAdmin!.from("users").insert({
      id: authUser.user.id, // Use the ID from Supabase Auth
      full_name: fullName,
      email: email, // Store email here too for easier querying if needed, ensure it's consistent
      role: role,
      school_id: schoolId,
    })

    if (profileInsertError) {
      console.error("Error inserting user profile:", profileInsertError)
      // Potentially attempt to delete the Supabase Auth user if profile creation fails (rollback)
      await supabaseAdmin!.auth.admin.deleteUser(authUser.user.id)
      console.warn(`Rolled back Supabase Auth user creation for ${authUser.user.id} due to profile insert error.`)
      return {
        success: false,
        message: "Failed to create user profile information.",
        errors: { _general: "Database profile insertion error." },
      }
    }

    // Propagate the new user into the Go sovereign directory so the backbone PDP/ReBAC knows about them
    // (one identity plane). Best-effort: a sync failure must NOT fail a registration that already succeeded.
    const sync = await syncUserToBackbone({ id: authUser.user.id, name: fullName, role, schoolId })
    if (!sync.synced) logger.info("backbone directory sync skipped", { id: authUser.user.id, reason: sync.reason })

    revalidatePath("/admin/users") // Or whatever path lists users
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
