// VASA-EOS(SE) — current-user → Subject resolver (server-only).
// Bridges Supabase auth (lib/auth) to the access PDP so server actions can enforce
// the platform policy. When no authenticated user is present, the fallback is
// SECURITY-CRITICAL: in production (a real database/auth is configured) an unresolved
// request must fail closed with NO roles, so it can never default to ADMIN. Only the
// credential-free demo (no database) falls back to a configurable DEMO_ROLE so the
// walkthrough keeps working; set DEMO_ROLE to test enforcement as a lesser role.

import { getUserIdFromAction, getUserRoleAndSchool } from "@/lib/auth/server"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"
import { PORTALS, type PortalRole } from "@/config/portals"
import { subjectForRoles } from "./policy"
import type { Subject } from "./index"

const VALID_ROLES = new Set<string>(Object.keys(PORTALS))

function asRole(value: string | undefined | null): PortalRole | null {
  const r = value?.toUpperCase()
  return r && VALID_ROLES.has(r) ? (r as PortalRole) : null
}

/**
 * The subject used when no authenticated user/role could be resolved. Pure and
 * injectable so the fail-closed gate is unit-tested without a live database.
 * - configured (production): return a role-less anonymous subject → canDo() denies.
 * - not configured (demo): fall back to DEMO_ROLE (default ADMIN) for the walkthrough.
 */
export function fallbackSubject(configured: boolean): Subject {
  if (configured) return subjectForRoles([], undefined, "anonymous")
  const demoRole = asRole(process.env.DEMO_ROLE) ?? "ADMIN"
  return subjectForRoles([demoRole], undefined, "demo")
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
    // Fall through to the fail-closed / demo fallback.
  }
  return fallbackSubject(isSupabaseAdminConfigured())
}
