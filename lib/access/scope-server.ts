import "server-only"

// Production enforcement seam for per-role data scoping. A server action that lists
// records calls scopeForCurrentSubject() to drop anything outside the signed-in
// subject's jurisdiction — the same ReBAC rule the Scope Explorer demonstrates, now
// applied to live data. Out-of-hierarchy roles (vendor/researcher/public) see no
// hierarchy-scoped records. Pure scoping logic lives in ./scope and is fully tested.

import { resolveSubject } from "./resolve"
import { nodeForRole, scopeRecords, SCOPE_TENANTS, type Scoped } from "./scope"
import type { Tenant } from "@/lib/tenancy"

/** The tenant node the current subject is anchored to, or undefined if out-of-hierarchy. */
export async function currentScopeNode(): Promise<string | undefined> {
  const subject = await resolveSubject()
  return nodeForRole(subject.roles[0])
}

/** Filter a scoped dataset to what the current subject may see. Fail-closed (empty). */
export async function scopeForCurrentSubject<T extends Scoped>(
  records: T[],
  tenants: Tenant[] = SCOPE_TENANTS,
): Promise<T[]> {
  const node = await currentScopeNode()
  if (!node) return []
  return scopeRecords(tenants, node, records)
}
