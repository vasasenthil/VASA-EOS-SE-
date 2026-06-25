// VASA-EOS(SE) — resolve the current signed-in role server-side (fail-soft).
// Prefers the demo-login session cookie; otherwise reads the Supabase profile.
// Returns an upper-case portal role (e.g. "BEO") or null. Never throws.

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { DEMO_COOKIE, DEMO_USERS } from "@/lib/demo-auth"
import { PORTALS, type PortalRole } from "@/config/portals"

export interface HeaderUser {
  name: string
  email: string
  avatarUrl?: string | null
  isDemo?: boolean
}

// One representative demo email per role (DEMO_USERS is email→role; we want role→email).
export const EMAIL_BY_ROLE: Record<string, string> = (() => {
  const m: Record<string, string> = {}
  for (const [email, role] of Object.entries(DEMO_USERS)) if (!m[role]) m[role] = email
  return m
})()

// Resolve the signed-in user for the global header (so the logout control shows after
// login). Prefers the demo-login session; otherwise the Supabase user. Null = guest.
export async function getHeaderUser(): Promise<HeaderUser | null> {
  const cookieStore = await cookies()

  const demo = cookieStore.get(DEMO_COOKIE)?.value
  if (demo) {
    const role = demo.toUpperCase()
    const label = PORTALS[role as PortalRole]?.label ?? role
    return { name: label, email: EMAIL_BY_ROLE[role] ?? "demo@vasa-eos.tn.gov.in", isDemo: true }
  }

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
    const { data: profile } = await supabase.from("users").select("full_name").eq("id", user.id).single()
    return { name: (profile?.full_name as string) || user.email || "Signed in", email: user.email ?? "" }
  } catch {
    return null
  }
}

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
