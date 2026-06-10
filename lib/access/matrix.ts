// VASA-EOS(SE) — role × permission access matrix (Security / RBAC transparency).
//
// The "who can do what" view a government access review needs — but NOT a hand-kept
// duplicate that drifts from reality. Every cell is computed live from the actual
// Policy Decision Point (canRole over the platform policy), so the matrix IS the
// engine's output: change a grant or a deny rule and this changes with it. Surfaces
// the 17 portal roles against the full action catalogue, with the elevated (CABAC
// time-boxed) actions called out. Pure + client-safe.

import { csvField } from "@/lib/csv"

import { DEFAULT_GRANTS, type PortalRole } from "@/config/portals"
import { canRole, allActions, ELEVATED_ACTIONS } from "./policy"
import type { Action } from "./index"

/** The portal roles, derived from the grant table (single source of truth). */
export const ROLES = Object.keys(DEFAULT_GRANTS) as PortalRole[]

export interface RolePermissions {
  role: PortalRole
  /** Actions permitted for this role under a normal (non-elevated) context. */
  actions: Action[]
}

/** The full matrix — each role's permitted actions, computed from the live PDP. */
export function accessMatrix(): RolePermissions[] {
  const actions = allActions()
  return ROLES.map((role) => ({
    role,
    actions: actions.filter((a) => canRole(role, a)),
  }))
}

export function permissionsFor(role: PortalRole): Action[] {
  return allActions().filter((a) => canRole(role, a))
}

export function rolesWith(action: Action): PortalRole[] {
  return ROLES.filter((r) => canRole(r, action))
}

export function isElevated(action: Action): boolean {
  return ELEVATED_ACTIONS.includes(action)
}

export interface MatrixSummary {
  roles: number
  actions: number
  elevatedActions: number
  /** Action permitted to the fewest roles (most privileged), for at-a-glance. */
  mostRestrictedAction: string
}

export function matrixSummary(): MatrixSummary {
  const actions = allActions()
  let mostRestricted = actions[0] ?? "—"
  let fewest = Number.POSITIVE_INFINITY
  for (const a of actions) {
    const n = rolesWith(a).length
    if (n > 0 && n < fewest) {
      fewest = n
      mostRestricted = a
    }
  }
  return {
    roles: ROLES.length,
    actions: actions.length,
    elevatedActions: ELEVATED_ACTIONS.length,
    mostRestrictedAction: mostRestricted,
  }
}


export function toCSV(matrix: RolePermissions[] = accessMatrix()): string {
  const header = ["Role", "Permitted actions", "Count"]
  const rows = matrix.map((r) => [r.role, r.actions.join("; "), String(r.actions.length)].map(csvField).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
