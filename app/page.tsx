import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"

// This function is self-contained to ensure it has no external dependencies that could fail.
const createClient = () => {
  const cookieStore = cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // This is a critical server configuration error.
    console.error("Root Page Error: Supabase URL or Anon Key is not set on the server.")
    // We cannot proceed without these, so we throw an error that Vercel will catch.
    // This will be clearly visible in the logs.
    throw new Error("Server configuration error: Supabase credentials are not available.")
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}

const userRoles = [
  "STUDENT",
  "TEACHER",
  "ADMIN",
  "PRINCIPAL",
  "SUBJECT_INCHARGE",
  "ACADEMIC_HEAD",
  "INSTITUTION_HEAD",
] as const
type UserRole = (typeof userRoles)[number]

export default async function RootPage() {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("Root Page Auth Error:", authError.message)
      // If there's an error getting the user, it's safest to redirect to login.
      redirect("/login?error=session_check_failed")
      return null
    }

    if (user) {
      // User is authenticated, now fetch their profile from the 'users' table.
      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()

      if (profileError || !userProfile) {
        console.error(`Root Page Profile Error for user ${user.id}:`, profileError?.message || "Profile not found.")
        // If the profile doesn't exist or there's an error, the user is in a bad state.
        // Log them out and send them to the login page with an error.
        redirect("/auth/logout?error=profile_not_found")
        return null
      }

      const userRole = userProfile.role.toUpperCase() as UserRole

      switch (userRole) {
        case "ADMIN":
          redirect("/admin/dashboard")
          break
        case "TEACHER":
          redirect("/teacher/dashboard")
          break
        case "STUDENT":
          redirect("/student/dashboard")
          break
        case "PRINCIPAL":
          redirect("/principal/dashboard")
          break
        case "SUBJECT_INCHARGE":
          redirect("/subject-incharge/dashboard")
          break
        case "ACADEMIC_HEAD":
          redirect("/academic-head/dashboard")
          break
        case "INSTITUTION_HEAD":
          redirect("/institution-head/dashboard")
          break
        default:
          console.warn(`Unknown role encountered for user ${user.id}: ${userProfile.role}. Logging out.`)
          redirect("/auth/logout?error=unknown_role")
      }
    } else {
      // No user is authenticated, redirect to the login page.
      redirect("/login")
    }
  } catch (error: any) {
    console.error("A critical unhandled error occurred in RootPage:", error.message)
    // This is a final catch-all. If anything above fails unexpectedly,
    // we'll log it and redirect to a generic error page or the login page.
    redirect("/login?error=server_exception")
  }

  return null // This line should not be reached due to redirects.
}
