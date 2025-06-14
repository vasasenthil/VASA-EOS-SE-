import type React from "react"
import { redirect } from "next/navigation"
import { Header } from "@/components/layout/header" // Assuming Header is updated or can handle user prop
import { Sidebar } from "@/components/layout/sidebar"
import { getSupabaseAuthUser } from "@/lib/auth/server" // Ensure these functions exist and work as expected
import { supabaseAdmin } from "@/lib/supabase/server" // For fetching full user details

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const authUser = await getSupabaseAuthUser()

  if (!authUser) {
    redirect("/login")
    return null
  }

  // Fetch user profile from your custom 'users' table
  // getUserRoleAndSchool might only return role and school_id. We need more for the header.
  const { data: userProfile, error: profileError } = await supabaseAdmin! // Use admin client for direct table access
    .from("users")
    .select("full_name, email, role, school_id, avatar_url") // Assuming avatar_url is a column
    .eq("id", authUser.id)
    .single()

  if (profileError || !userProfile) {
    console.error("Error fetching user profile for dashboard or profile not found:", profileError)
    // Handle this case: redirect to login, show error, or attempt to create a profile if appropriate
    // For now, redirecting to login with an error.
    redirect("/login?error=profile_fetch_failed")
    return null
  }

  const { full_name, email, role, avatar_url } = userProfile

  // Pass user details to Header if it's designed to accept them
  // Otherwise, Header might need to become a Server Component itself or use a context
  const headerUserData = {
    name: full_name || "User",
    email: email || "",
    avatarUrl: avatar_url || `/placeholder.svg?width=40&height=40&text=${(full_name || "U").charAt(0)}`,
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header userData={headerUserData} /> {/* Pass user data to Header */}
      <div className="flex flex-1 pt-16">
        {" "}
        {/* pt-16 to offset fixed header */}
        <Sidebar userRole={role} />
        <main className="flex-1 overflow-y-auto bg-muted/40 p-4 pl-64 md:p-8">
          {" "}
          {/* pl-64 to offset fixed sidebar */}
          {children}
        </main>
      </div>
    </div>
  )
}
