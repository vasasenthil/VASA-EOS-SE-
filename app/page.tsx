import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"

const createClient = async () => {
  const cookieStore = await cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Root Page Error: Supabase URL or Anon Key is not set on the server.")
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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If there is no user, it means they are not logged in.
  // This is the expected path for any new visitor.
  if (!user) {
    redirect("/login")
    return null
  }

  // If we get here, a user is logged in. Now we must check their role.
  try {
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || !userProfile) {
      console.error(`Root Page Profile Error for user ${user.id}:`, profileError?.message || "Profile not found.")
      // If the profile is missing, the user is in a bad state. Log them out.
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
  } catch (error: any) {
    console.error("A critical error occurred after login check in RootPage:", error.message)
    redirect("/login?error=server_exception")
  }

  return null
}
