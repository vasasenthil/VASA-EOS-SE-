import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { PORTALS, type PortalRole } from "@/config/portals"
import { DEMO_COOKIE } from "@/lib/demo-auth"

export default async function RootPage() {
  const cookieStore = await cookies()

  // Demo-login session (used when Supabase is unreachable) → straight to the role home.
  const demoRole = cookieStore.get(DEMO_COOKIE)?.value?.toUpperCase()
  if (demoRole && PORTALS[demoRole as PortalRole]) {
    redirect(PORTALS[demoRole as PortalRole].home)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Compute a destination without ever throwing — an unreachable/missing Supabase
  // should send visitors to /login, not crash the root with "fetch failed".
  let target = "/login"
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: { get: (name: string) => cookieStore.get(name)?.value },
      })
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
        const role = profile?.role?.toUpperCase() as PortalRole | undefined
        target = role && PORTALS[role] ? PORTALS[role].home : "/login"
      }
    } catch (e) {
      console.error("Root page: Supabase unreachable, redirecting to /login.", e)
      target = "/login"
    }
  }

  redirect(target)
}
