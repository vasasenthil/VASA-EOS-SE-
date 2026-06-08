// VASA-EOS(SE) — RLS tenant-context helper (Multi-Tenancy isolation, app side).
//
// Pairs with scripts/019-tenant-rls.sql. Before running tenant-scoped queries on a
// non-service connection, the app sets a per-request GUC `app.tenant_ids` to the set
// of tenant nodes the signed-in subject governs (lib/access/scope.visibleTenantIds).
// The RLS policy then admits only rows whose tenant_id is in that set. Pure helpers
// (SQL-string builders) so they are unit-testable; the actual SET runs server-side.

import { nodeForRole, visibleTenantIds, SCOPE_TENANTS } from "@/lib/access/scope"

/** Sanitise a tenant id to the safe charset used by node ids (defensive). */
function sanitise(id: string): string {
  return id.replace(/[^A-Za-z0-9_-]/g, "")
}

/** The comma-separated GUC value for a subject's governed tenant ids (deduped). */
export function tenantGucValue(visibleTenantIds: string[]): string {
  const clean = [...new Set(visibleTenantIds.map(sanitise).filter(Boolean))]
  return clean.join(",")
}

/**
 * `SET LOCAL app.tenant_ids = '...'` — scoped to the current transaction so it never
 * leaks across pooled connections. An empty set yields '' (RLS then admits nothing).
 */
export function setTenantSubtreeSql(visibleTenantIds: string[]): string {
  return `SET LOCAL app.tenant_ids = '${tenantGucValue(visibleTenantIds)}'`
}

// ── Per-request binding ──────────────────────────────────────────────────────

/** The GUC value for a role: its anchor node's governed subtree (pure). */
export function tenantContextFor(role: string | null | undefined): string {
  const node = nodeForRole(role)
  if (!node) return "" // out-of-hierarchy roles govern nothing → RLS admits nothing
  return tenantGucValue(visibleTenantIds(SCOPE_TENANTS, node))
}

/** Minimal shape of the DB client used for the RLS RPC (testable with a fake). */
export interface RlsDb {
  rpc(fn: string, args: Record<string, unknown>): Promise<unknown>
}

/**
 * Bind the tenant context for a role on the connection (calls the set_tenant_context
 * RPC from scripts/019). Returns the GUC value that was applied. Best-effort: a missing
 * RPC must not crash the request — RLS then admits nothing (fail-closed).
 */
export async function applyTenantContext(db: RlsDb, role: string | null | undefined): Promise<string> {
  const ids = tenantContextFor(role)
  try {
    await db.rpc("set_tenant_context", { ids })
  } catch {
    // RPC unavailable (e.g. RLS not migrated) — leave context unset (fail-closed).
  }
  return ids
}
