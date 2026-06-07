// VASA-EOS(SE) — server-action access guard (production-grade enforcement).
// Resolves the current subject and checks the platform access policy. Returns true
// when permitted, false when denied — server actions call this and fail soft. In the
// credential-free demo, resolveSubject() defaults to ADMIN, so the walkthrough is
// unaffected; set DEMO_ROLE to a lower-privileged role to see enforcement bite.

import { AccessDeniedError, requireAccess } from "./policy"
import { resolveSubject } from "./resolve"
import type { Action, ResourceRef } from "./index"
import { logger } from "@/lib/logger"

export async function canDo(action: Action, resource: ResourceRef = { type: "*" }): Promise<boolean> {
  try {
    const subject = await resolveSubject()
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
