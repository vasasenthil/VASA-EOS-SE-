"use server"

import { z } from "zod"
import { cookies } from "next/headers"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

// Helper to create Supabase client within server actions
// Ensure this matches or is consistent with your lib/supabase/server.ts or lib/auth/server.ts
const createClient = () => {
  const cookieStore = cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch (error) {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

const loginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(1, "Password is required."), // Basic check, Supabase handles complexity
  role: z.enum(["STUDENT", "TEACHER", "ADMIN"], { message: "Invalid role selected." }),
})

export interface LoginState {
  success: boolean
  message: string
  errors?: Partial<Record<keyof z.infer<typeof loginSchema> | "_general", string>> | null
  redirectPath?: string | null
}

export async function loginAction(prevState: LoginState, formData: FormData): Promise<LoginState> {
  const supabase = createClient()

  const validatedFields = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"), // Role selected on the form
  })

  if (!validatedFields.success) {
    const fieldErrors: Partial<Record<keyof z.infer<typeof loginSchema>, string>> = {}
    for (const issue of validatedFields.error.issues) {
      fieldErrors[issue.path[0] as keyof z.infer<typeof loginSchema>] = issue.message
    }
    return {
      success: false,
      message: "Validation failed. Please check your input.",
      errors: fieldErrors,
    }
  }

  const { email, password, role: selectedRoleOnForm } = validatedFields.data

  // Step 1: Sign in with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData.user) {
    console.error("Supabase Auth Error:", authError?.message)
    return {
      success: false,
      message: authError?.message || "Invalid login credentials.",
      errors: { _general: authError?.message || "Invalid email or password." },
    }
  }

  // Step 2: Fetch user profile from custom 'users' table to verify role and get redirect path
  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select("role") // Only fetch role for verification
    .eq("id", authData.user.id)
    .single()

  if (profileError || !userProfile) {
    console.error("Profile fetch error or profile not found:", profileError?.message)
    // Sign out the user as their profile is missing or inaccessible
    await supabase.auth.signOut()
    return {
      success: false,
      message: "User profile not found or inaccessible. Please contact support.",
      errors: { _general: "User profile error. Please contact support." },
    }
  }

  const actualUserRole = userProfile.role.toUpperCase()

  // Optional: Verify if the role selected on the form matches the actual role in the DB.
  // For enhanced security, you might want to enforce this.
  // For simplicity here, we'll prioritize the DB role for redirection.
  // if (actualUserRole !== selectedRoleOnForm.toUpperCase()) {
  //   await supabase.auth.signOut(); // Log out if roles mismatch significantly
  //   return {
  //     success: false,
  //     message: "Role selection mismatch. Please select your correct role.",
  //     errors: { role: "Incorrect role selected for this account." },
  //   };
  // }

  let redirectPath = "/login?error=unknown_role" // Default fallback
  switch (actualUserRole) {
    case "ADMIN":
      redirectPath = "/admin/dashboard"
      break
    case "TEACHER":
      redirectPath = "/teacher/dashboard"
      break
    case "STUDENT":
      redirectPath = "/student/dashboard"
      break
    default:
      // If role is unknown, sign out and show error
      await supabase.auth.signOut()
      return {
        success: false,
        message: "Unknown user role. Access denied.",
        errors: { _general: "Your account has an unrecognized role." },
      }
  }

  // Instead of returning redirectPath for client-side redirect,
  // perform server-side redirect directly from the action.
  // This is generally preferred for form actions that result in navigation.
  // However, to show a success toast, client-side redirect after state update is common.
  // For this iteration, we'll return the path and let the client handle it for the toast.
  return {
    success: true,
    message: "Login successful! Redirecting...",
    redirectPath: redirectPath,
  }
  // If you prefer server-side redirect immediately:
  // redirect(redirectPath);
  // Note: if you use redirect() here, the LoginState return type isn't fully utilized for success.
}
