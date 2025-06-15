"use server"

import { z } from "zod"
import { cookies } from "next/headers"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

const createClient = () => {
  console.log("--- Inside createClient for loginAction ---")
  console.log(
    "NEXT_PUBLIC_SUPABASE_URL for client:",
    process.env.NEXT_PUBLIC_SUPABASE_URL ? "Exists" : "MISSING OR UNDEFINED",
  )
  console.log(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY for client:",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Exists" : "MISSING OR UNDEFINED",
  )

  const cookieStore = cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {}
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch (error) {}
      },
    },
  })
}

const userRolesEnum = z.enum([
  "STUDENT",
  "TEACHER",
  "ADMIN", // This will map to System Admin
  "PRINCIPAL",
  "SUBJECT_INCHARGE",
  "ACADEMIC_HEAD",
  "INSTITUTION_HEAD",
])

const loginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
  role: userRolesEnum,
})

export interface LoginState {
  success: boolean
  message: string
  errors?: Partial<Record<keyof z.infer<typeof loginSchema> | "_general", string>> | null
  redirectPath?: string | null
}

export async function loginAction(prevState: LoginState, formData: FormData): Promise<LoginState> {
  console.log("--- Inside loginAction ---")
  console.log("Attempting to read NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log("Attempting to read NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  // The existing createClient function which uses these variables
  const supabase = createClient()

  const validatedFields = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
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

  const { email, password } = validatedFields.data // Role from form is validated but DB role is source of truth

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData.user) {
    return {
      success: false,
      message: authError?.message || "Invalid login credentials.",
      errors: { _general: authError?.message || "Invalid email or password." },
    }
  }

  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", authData.user.id)
    .single()

  if (profileError || !userProfile) {
    await supabase.auth.signOut()
    return {
      success: false,
      message: "User profile not found or inaccessible. Please contact support.",
      errors: { _general: "User profile error. Please contact support." },
    }
  }

  const actualUserRole = userProfile.role.toUpperCase() as z.infer<typeof userRolesEnum>

  let redirectPath = "/login?error=unknown_role"
  switch (actualUserRole) {
    case "ADMIN": // System Admin
      redirectPath = "/admin/dashboard"
      break
    case "TEACHER":
      redirectPath = "/teacher/dashboard"
      break
    case "STUDENT":
      redirectPath = "/student/dashboard"
      break
    case "PRINCIPAL":
      redirectPath = "/principal/dashboard"
      break
    case "SUBJECT_INCHARGE":
      redirectPath = "/subject-incharge/dashboard"
      break
    case "ACADEMIC_HEAD":
      redirectPath = "/academic-head/dashboard"
      break
    case "INSTITUTION_HEAD":
      redirectPath = "/institution-head/dashboard"
      break
    default:
      await supabase.auth.signOut()
      return {
        success: false,
        message: "Unknown user role. Access denied.",
        errors: { _general: "Your account has an unrecognized role." },
      }
  }

  return {
    success: true,
    message: "Login successful! Redirecting...",
    redirectPath: redirectPath,
  }
}
