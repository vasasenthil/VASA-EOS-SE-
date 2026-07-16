import { cookies } from "next/headers"
import type { NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export interface VasaSession {
  subject: string
  email?: string
  roles: string[]
  metadata: Record<string, unknown>
  tenant: Record<string, string | undefined>
}

function decodeBase64UrlJson(segment: string): Record<string, unknown> | null {
  try {
    const padded = segment.padEnd(segment.length + ((4 - (segment.length % 4)) % 4), "=")
    return JSON.parse(Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")) as Record<string, unknown>
  } catch {
    return null
  }
}

export function sessionFromJwt(token: string): VasaSession | null {
  const payload = decodeBase64UrlJson(token.split(".")[1] ?? "")
  if (!payload) return null
  const app = (payload.app_metadata ?? {}) as Record<string, unknown>
  const user = (payload.user_metadata ?? {}) as Record<string, unknown>
  const rawRoles = app.roles ?? app.vasa_roles ?? user.roles ?? user.vasa_roles ?? payload.role
  const roles = Array.isArray(rawRoles) ? rawRoles.map(String) : typeof rawRoles === "string" ? rawRoles.split(/[ ,]+/).filter(Boolean) : []
  const subject = String(payload.sub ?? "")
  if (!subject) return null
  return {
    subject,
    email: typeof payload.email === "string" ? payload.email : undefined,
    roles: roles.map((role) => role.toUpperCase()),
    metadata: { ...user, ...app },
    tenant: {
      schoolId: String(user.school_id ?? app.school_id ?? "") || undefined,
      blockId: String(user.block_id ?? app.block_id ?? "") || undefined,
      districtId: String(user.district_id ?? app.district_id ?? "") || undefined,
      stateId: String(user.state_id ?? app.state_id ?? "") || undefined,
    },
  }
}

export async function getSessionFromRequest(req: NextRequest): Promise<VasaSession | null> {
  const bearer = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (bearer) return sessionFromJwt(bearer)
  let cookieStore: Awaited<ReturnType<typeof cookies>>
  try {
    cookieStore = await cookies()
  } catch {
    return null
  }
  const supabase = createSupabaseServerClient(cookieStore)
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  const metadata = { ...(data.user.user_metadata ?? {}), ...(data.user.app_metadata ?? {}) }
  const rolesValue = metadata.roles ?? metadata.vasa_roles ?? data.user.role
  const roles = Array.isArray(rolesValue) ? rolesValue.map(String) : typeof rolesValue === "string" ? rolesValue.split(/[ ,]+/) : []
  return {
    subject: data.user.id,
    email: data.user.email ?? undefined,
    roles: roles.filter(Boolean).map((role) => role.toUpperCase()),
    metadata,
    tenant: {
      schoolId: String(metadata.school_id ?? "") || undefined,
      blockId: String(metadata.block_id ?? "") || undefined,
      districtId: String(metadata.district_id ?? "") || undefined,
      stateId: String(metadata.state_id ?? "") || undefined,
    },
  }
}
