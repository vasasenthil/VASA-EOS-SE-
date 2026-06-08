// VASA-EOS(SE) — RLS tenant-context helper (Multi-Tenancy isolation, app side).
//
// Pairs with scripts/019-tenant-rls.sql. Before running tenant-scoped queries on a
// non-service connection, the app sets a per-request GUC `app.tenant_ids` to the set
// of tenant nodes the signed-in subject governs (lib/access/scope.visibleTenantIds).
// The RLS policy then admits only rows whose tenant_id is in that set. Pure helpers
// (SQL-string builders) so they are unit-testable; the actual SET runs server-side.

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
