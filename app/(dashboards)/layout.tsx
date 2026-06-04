// app/(dashboards)/layout.tsx
export const dynamic = 'force-dynamic'

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { Sidebar } from "@/components/layout/sidebar"

export default async function DashboardsLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let userRole = "STUDENT" // default fallback

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: { get(name: string) { return cookieStore.get(name)?.value } }
      })
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
        if (profile?.role) userRole = profile.role.toUpperCase()
      }
    } catch {}
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar userRole={userRole} />
      <main className="flex-1 md:ml-64 min-h-screen">
        {children}
      </main>
    </div>
  )
}
