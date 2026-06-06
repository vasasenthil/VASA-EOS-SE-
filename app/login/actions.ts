"use server"

import { z } from "zod"
import { cookies } from "next/headers"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { PORTALS, type PortalRole } from "@/config/portals"
import { demoAuthenticate, DEMO_COOKIE } from "@/lib/demo-auth"

// Demo-login fallback: used only when Supabase Auth is unconfigured or unreachable
// (the "fetch failed" preview case). A reachable Supabase always takes precedence.
async function demoLogin(email: string, password: string): Promise<LoginState> {
  const role = demoAuthenticate(email, password)
  if (!role || !PORTALS[role as PortalRole]) {
    return {
      success: false,
      message: "Invalid login credentials.",
      errors: { _general: "Invalid email or password (demo mode — Supabase unreachable)." },
    }
  }
  const cookieStore = await cookies()
  cookieStore.set(DEMO_COOKIE, role, { httpOnly: true, sameSite: "lax", path: "/" })
  return {
    success: true,
    message: "Signed in (demo mode — Supabase unreachable). Redirecting…",
    redirectPath: PORTALS[role as PortalRole].home,
  }
}

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

  // No Supabase configured → demo-login fallback (walkthrough mode).
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase not configured; using demo-login fallback.")
    return demoLogin(email, password)
  }

  let authData: Awaited<ReturnType<Awaited<ReturnType<typeof createClient>>["auth"]["signInWithPassword"]>>["data"]
  let supabase: Awaited<ReturnType<typeof createClient>>
  try {
    supabase = await createClient()
    console.log(`Attempting login for email: ${email}`)
    const result = await supabase.auth.signInWithPassword({ email, password })
    authData = result.data
    if (result.error || !result.data?.user) {
      console.error("Authentication error:", result.error?.message)
      return {
        success: false,
        message: result.error?.message || "Invalid login credentials.",
        errors: { _general: result.error?.message || "Invalid email or password." },
      }
    }
  } catch (e) {
    // Supabase unreachable ("fetch failed") → demo-login fallback so the walkthrough works.
    console.error("Supabase unreachable; using demo-login fallback:", e)
    return demoLogin(email, password)
  }

  if (!authData?.user) {
    return {
      success: false,
      message: "Invalid login credentials.",
      errors: { _general: "Invalid email or password." },
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
