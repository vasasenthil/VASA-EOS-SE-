// VASA-EOS(SE) — current-user → Subject resolver (server-only).
// Bridges Supabase auth (lib/auth) to the access PDP so server actions can enforce
// the platform policy. When no authenticated user is present (demo / unauthenticated)
// it falls back to a configurable DEMO_ROLE (default ADMIN) so the credential-free
// demo keeps working; set DEMO_ROLE to test enforcement as a less-privileged role.

import { getUserIdFromAction, getUserRoleAndSchool } from "@/lib/auth/server"
import { PORTALS, type PortalRole } from "@/config/portals"
import { subjectForRoles } from "./policy"
import type { Subject } from "./index"

const VALID_ROLES = new Set<string>(Object.keys(PORTALS))

function asRole(value: string | undefined | null): PortalRole | null {
  const r = value?.toUpperCase()
  return r && VALID_ROLES.has(r) ? (r as PortalRole) : null
}

export async function resolveSubject(): Promise<Subject> {
  try {
    const userId = await getUserIdFromAction()
    if (userId) {
      const info = await getUserRoleAndSchool(userId)
      const role = asRole(info?.role)
      if (role) return subjectForRoles([role], { school: info?.school_id ?? "" }, userId)
    }
  } catch {
    // Fall through to the demo subject.
  }
  const demoRole = asRole(process.env.DEMO_ROLE) ?? "ADMIN"
  return subjectForRoles([demoRole], undefined, "demo")
}
