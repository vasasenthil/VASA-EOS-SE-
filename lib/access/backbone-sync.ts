// VASA-EOS(SE) — identity-plane bridge: propagate a Next.js user into the Go sovereign directory (the durable
// identity plane the five-model PDP decides over). This closes the "two disconnected user systems" gap: a user
// registered in the app becomes known to the backbone's RBAC/ABAC/ReBAC engine.
//
// Correctness rule: the Go directory's org_unit MUST be a REAL tenancy node, or ReBAC will deny everything for
// that user. We only sync where the node is unambiguous:
//   - school-tier users carry a school_id (a UDISE = a T6 tenancy node)  → org_unit = school_id
//   - state-tier roles map to canonical Go nodes (TN / TN-SEC / TN-DIR-DSE)
//   - district/block roles (DEO/BEO/CRCC) with no resolvable node are SKIPPED rather than mis-anchored.
// When PLATFORM_URL is unset the sync is a no-op (the credential-free demo is unaffected).

import { platformConfigured, platformUpsertUser, platformResolveNode } from "@/lib/platform-client"
import { backendRoleFor } from "./pdp-bridge"
import { logger } from "@/lib/logger"

// District/block officer roles whose org unit must be resolved from a governance hint (district name), not a
// school id. Completes UM-1/G-4 for the field-officer tiers.
const DISTRICT_ROLE = new Set(["DEO", "CEO"])

// Canonical Go tenancy nodes for the state-tier roles that have no school anchor.
const STATE_NODE: Record<string, string> = {
  MINISTER: "TN",
  ADMIN: "TN",
  SECRETARY: "TN-SEC",
  DIRECTOR: "TN-DIR-DSE",
}

/** Resolve the backbone org-unit (tenancy node) for a user, or null when it cannot be anchored safely. */
export function backboneOrgUnit(role: string, schoolId?: string | null): string | null {
  if (schoolId && schoolId.trim()) return schoolId.trim() // a UDISE is a valid T6 tenancy node
  return STATE_NODE[role] ?? null
}

export interface BackboneSyncInput {
  id: string
  name?: string
  role: string
  schoolId?: string | null
  /** District name for a field officer (DEO/CEO) — resolved to its tenancy node via the backbone. */
  district?: string | null
}

/**
 * Upsert a user into the Go directory. Returns whether it synced and, if not, a precise reason — so callers can
 * log it without failing the (Supabase) registration that already succeeded. District/block officers are
 * anchored by resolving their district name to a real tenancy node via the backbone (no mis-anchoring).
 */
export async function syncUserToBackbone(u: BackboneSyncInput): Promise<{ synced: boolean; reason?: string }> {
  if (!platformConfigured()) return { synced: false, reason: "platform backbone not configured (PLATFORM_URL unset)" }
  let orgUnit = backboneOrgUnit(u.role, u.schoolId)
  // a district officer's org unit comes from their district, resolved to a real T3 tenancy node.
  if (!orgUnit && DISTRICT_ROLE.has(u.role) && u.district) {
    try {
      const r = await platformResolveNode({ district: u.district })
      if (r.resolved) orgUnit = r.node
    } catch (e) {
      logger.warn("backbone node resolve failed", { id: u.id, error: String(e) })
    }
  }
  if (!orgUnit) {
    return { synced: false, reason: `org unit not resolvable for role ${u.role} (need a school id or a resolvable district)` }
  }
  const attributes: Record<string, string> = {}
  if (u.role === "TEACHER" || u.role === "PRINCIPAL") attributes.cadre = "teaching"
  try {
    const out = await platformUpsertUser({
      id: u.id,
      name: u.name,
      role: backendRoleFor(u.role),
      org_unit: orgUnit,
      attributes,
    })
    if (!out.ok) logger.warn("backbone user sync rejected", { id: u.id, error: out.error })
    return { synced: out.ok, reason: out.ok ? undefined : out.error }
  } catch (e) {
    logger.warn("backbone user sync failed (registration still succeeded)", { id: u.id, error: String(e) })
    return { synced: false, reason: String(e) }
  }
}
