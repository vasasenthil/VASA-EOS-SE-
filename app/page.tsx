import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"

// Helper to create a Supabase client for server-side checks
// This is a simplified version for this specific page.
// For broader use, ensure you're using the one from lib/supabase/server.ts or lib/auth/server.ts
const createClient = () => {
  const cookieStore = cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      // Add set and remove if needed, though for getUser they might not be strictly necessary here
      // For robustness, include them as in lib/auth/server.ts
    },
  })
}

export default async function RootPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // User is logged in, fetch their role from your custom 'users' table
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || !userProfile) {
      console.error("Error fetching user profile or profile not found, logging out:", profileError)
      // Redirect to login, or handle error appropriately.
      // Optionally, you could sign the user out here if their profile is missing.
      // await supabase.auth.signOut(); // Uncomment if you want to force logout on profile error
      redirect("/login?error=profile_not_found")
      return null
    }

    switch (userProfile.role) {
      case "ADMIN":
        redirect("/admin/dashboard")
        break
      case "TEACHER":
        redirect("/teacher/dashboard")
        break
      case "STUDENT":
        redirect("/student/dashboard")
        break
      default:
        // Fallback if role is unknown or not set
        redirect("/login?error=unknown_role")
    }
  } else {
    // No user, redirect to login
    redirect("/login")
  }
  return null // Should not be reached
}
