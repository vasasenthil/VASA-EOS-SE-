import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"

const createClient = () => {
  const cookieStore = cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
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
] as const // Use const assertion for stricter typing
type UserRole = (typeof userRoles)[number]

export default async function RootPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || !userProfile) {
      console.error("Error fetching user profile or profile not found, logging out:", profileError)
      redirect("/login?error=profile_not_found")
      return null
    }

    const userRole = userProfile.role.toUpperCase() as UserRole

    switch (userRole) {
      case "ADMIN": // System Admin
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
        // This case should ideally not be reached if roles are well-defined
        // const _exhaustiveCheck: never = userRole; // For exhaustive checks at compile time
        console.warn(`Unknown role encountered: ${userProfile.role}, redirecting to login.`)
        redirect("/login?error=unknown_role")
    }
  } else {
    redirect("/login")
  }
  return null
}
