import { NextResponse, type NextRequest } from "next/server"
import { extractRoles, type VasaRole } from "./role-extractor"
import { getSessionFromRequest, type VasaSession } from "./session"

export type RoleCheck = { ok: true; session: VasaSession; roles: VasaRole[] } | { ok: false; response: NextResponse }

export async function requireRole(req: NextRequest, required: VasaRole[]): Promise<RoleCheck> {
  const session = await getSessionFromRequest(req)
  if (!session) return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  const roles = extractRoles(session)
  if (!required.some((role) => roles.includes(role) || roles.includes("ADMIN"))) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }
  return { ok: true, session, roles }
}
