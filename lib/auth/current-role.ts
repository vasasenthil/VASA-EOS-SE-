// VASA-EOS(SE) — resolve the current signed-in role server-side (fail-soft).
// Prefers the demo-login session cookie; otherwise reads the Supabase profile.
// Returns an upper-case portal role (e.g. "BEO") or null. Never throws.

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { DEMO_COOKIE } from "@/lib/demo-auth"

export async function getCurrentRole(): Promise<string | null> {
  const cookieStore = await cookies()

  const demo = cookieStore.get(DEMO_COOKIE)?.value
  if (demo) return demo.toUpperCase()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  try {
    const supabase = createServerClient(url, key, {
      cookies: { get: (name: string) => cookieStore.get(name)?.value },
    })
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
    return profile?.role ? String(profile.role).toUpperCase() : null
  } catch {
    return null
  }
}
