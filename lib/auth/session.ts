import { cookies } from "next/headers"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { resolveSupabaseAnonKey, resolveSupabaseUrl } from "@/lib/db/environment"

export interface VasaSession {
  subject: string
  email?: string
  roles: string[]
  metadata: Record<string, unknown>
  tenant: Record<string, string | undefined>
}

// Call only with a user returned by the configured Auth server's getUser().
function sessionFromVerifiedUser(user: {
  id: string
  email?: string
  app_metadata?: Record<string, unknown>
}): VasaSession | null {
  if (!user.id) return null
  const app = user.app_metadata ?? {}
  const raw = app.roles ?? app.vasa_roles
  const roles = Array.isArray(raw)
    ? raw.filter((role): role is string => typeof role === "string")
    : typeof raw === "string" ? raw.split(/[ ,]+/) : []
  const claim = (key: string) => typeof app[key] === "string" && app[key].trim()
    ? app[key].trim() : undefined
  return {
    subject: user.id,
    email: user.email,
    roles: [...new Set(roles.map(role => role.trim().toUpperCase()).filter(Boolean))],
    metadata: { ...app },
    tenant: {
      schoolId: claim("school_id"), blockId: claim("block_id"),
      districtId: claim("district_id"), stateId: claim("state_id"),
    },
  }
}

// Async by design: never construct authority from a decoded, unverified token.
export async function sessionFromJwt(token: string): Promise<VasaSession | null> {
  const url = resolveSupabaseUrl()
  const key = resolveSupabaseAnonKey()
  if (!url || !key || !token) return null
  try {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
    const { data, error } = await client.auth.getUser(token)
    return error || !data.user ? null : sessionFromVerifiedUser(data.user)
  } catch {
    return null
  }
}

export async function getSessionFromRequest(req: NextRequest): Promise<VasaSession | null> {
  const authorization = req.headers.get("authorization")
  if (authorization !== null) {
    const bearer = authorization.match(/^Bearer\s+(\S+)$/i)?.[1]
    // An invalid explicit credential must not fall back to another session.
    return bearer ? sessionFromJwt(bearer) : null
  }
  return getSession()
}

export async function getSession(): Promise<VasaSession | null> {
  try {
    const client = createSupabaseServerClient(await cookies())
    const { data, error } = await client.auth.getUser()
    return error || !data.user ? null : sessionFromVerifiedUser(data.user)
  } catch {
    return null
  }
}

export async function requireRole(role: string): Promise<{ user: { id: string; email?: string }; roles: string[]; session: VasaSession }> {
  const session = await getSession()
  if (!session) throw new Error("Unauthorized")
  const wanted = role.toUpperCase()
  if (!session.roles.includes("ADMIN") && !session.roles.includes(wanted)) throw new Error("Forbidden")
  return { user: { id: session.subject, email: session.email }, roles: session.roles, session }
}
