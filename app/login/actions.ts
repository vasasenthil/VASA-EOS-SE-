"use server"

import { z } from "zod"
import { cookies } from "next/headers"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { PORTALS, type PortalRole } from "@/config/portals"

const createClient = async () => {
  console.log("--- Inside createClient for loginAction ---")
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("NEXT_PUBLIC_SUPABASE_URL for client:", supabaseUrl ? "Exists" : "MISSING OR UNDEFINED")
  console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY for client:", supabaseAnonKey ? "Exists" : "MISSING OR UNDEFINED")

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL or Anon Key is missing. Cannot create client.")
    // Potentially throw an error or return a specific state if this happens
    // For now, createServerClient will likely error out if these are undefined.
  }

  const cookieStore = await cookies()
  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
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

// The form role is a UI hint only — the DB role is the source of truth. Accept any
// of the registered portal roles (see config/portals).
const loginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
  role: z.string().min(1, "Please select a role."),
})

export interface LoginState {
  success: boolean
  message: string
  errors?: Partial<Record<keyof z.infer<typeof loginSchema> | "_general", string>> | null
  redirectPath?: string | null
}

export async function loginAction(prevState: LoginState, formData: FormData): Promise<LoginState> {
  console.log("--- Inside loginAction ---")
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  console.log("Attempting to read NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "Exists" : "MISSING")
  console.log("Attempting to read NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey ? "Exists" : "MISSING")

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      success: false,
      message: "Server configuration error. Supabase credentials missing.",
      errors: { _general: "Server configuration error. Please contact support." },
    }
  }

  const supabase = await createClient()

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

  const { email, password } = validatedFields.data

  console.log(`Attempting login for email: ${email}`)
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData?.user) {
    console.error("Authentication error:", authError?.message)
    return {
      success: false,
      message: authError?.message || "Invalid login credentials.",
      errors: { _general: authError?.message || "Invalid email or password." },
    }
  }

  console.log(`Authentication successful for user ID: ${authData.user.id}. Fetching profile...`)
  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", authData.user.id)
    .single()

  if (profileError || !userProfile) {
    console.error("Error fetching user profile from 'users' table:", profileError?.message)
    console.error("Full profileError object:", JSON.stringify(profileError, null, 2))
    await supabase.auth.signOut() // Sign out the user if profile fetch fails
    return {
      success: false,
      message: "User profile not found or inaccessible. Please contact support.",
      errors: { _general: "User profile error. Please contact support." },
    }
  }

  console.log(`User profile fetched successfully. Role: ${userProfile.role}`)
  const actualUserRole = userProfile.role.toUpperCase() as PortalRole

  // Route to the role's portal home (single source of truth: config/portals).
  const portal = PORTALS[actualUserRole]
  if (!portal) {
    console.warn(`Unknown role encountered after profile fetch: ${userProfile.role}`)
    await supabase.auth.signOut()
    return {
      success: false,
      message: "Unknown user role. Access denied.",
      errors: { _general: "Your account has an unrecognized role." },
    }
  }
  const redirectPath = portal.home

  console.log(`Login successful! Redirecting to: ${redirectPath}`)
  return {
    success: true,
    message: "Login successful! Redirecting...",
    redirectPath: redirectPath,
  }
}
