// VASA-EOS(SE) — server-action access guard (production-grade enforcement).
// Resolves the current subject and authorises the action. When the Go sovereign backbone is configured
// (PLATFORM_URL set), the decision is delegated to its unified five-model PDP (RBAC·ABAC·ReBAC·PBAC·CABAC) so
// the frontend and the backbone share ONE decision engine; otherwise the local PDP is used. In a configured
// production deployment resolveSubject() fails closed (a role-less anonymous subject) — it never defaults to
// ADMIN; only the credential-free demo (no database) falls back to a configurable DEMO_ROLE.

import { AccessDeniedError, requireAccess } from "./policy"
import { resolveSubject } from "./resolve"
import { decideViaPlatform } from "./pdp-bridge"
import type { Action, ResourceRef } from "./index"
import { logger } from "@/lib/logger"

function resourceOrgOf(resource: ResourceRef): string {
  const a = resource.attributes ?? {}
  const v = a.tenantId ?? a.orgUnit ?? a.school
  return typeof v === "string" ? v : ""
}

export async function canDo(action: Action, resource: ResourceRef = { type: "*" }): Promise<boolean> {
  try {
    const subject = await resolveSubject()
    // Sovereign PDP first: authoritative when configured AND the action maps; null = fall back to local PDP.
    const viaPlatform = await decideViaPlatform(subject, action, resourceOrgOf(resource))
    if (viaPlatform !== null) {
      if (!viaPlatform) logger.warn("access denied (sovereign PDP)", { action })
      return viaPlatform
    }
    requireAccess(subject, action, resource)
    return true
  } catch (e) {
    if (e instanceof AccessDeniedError) {
      logger.warn("access denied", { action, reason: e.reason })
      return false
    }
    // Resolution failure (e.g. Supabase unreachable) must not silently authorise.
    logger.error("access check errored; denying", { action, error: String(e) })
    return false
  }
}
