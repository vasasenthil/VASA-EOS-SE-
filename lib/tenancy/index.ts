// VASA-EOS(SE) — sovereign multi-tenancy (Part XIII).
// Constitutional federalism made operational: National -> State -> Directorate ->
// District -> Block -> Cluster -> School. Each tenant owns its data; cross-tenant
// access is opt-in with consent. TN is the primary sovereign tenant.

export type TenantTier =
  | "national"
  | "state"
  | "directorate"
  | "district"
  | "block"
  | "cluster"
  | "school"

export interface Tenant {
  id: string
  tier: TenantTier
  name: string
  parentId?: string
}

export interface TierInfo {
  tier: TenantTier
  label: string
  example: string
  scale: string
}

export const TENANT_TIERS: TierInfo[] = [
  { tier: "national", label: "National (reference)", example: "NDEAR defaults, NCF 2023", scale: "India" },
  { tier: "state", label: "State (sovereign)", example: "Tamil Nadu — SEP 2022, Tamil-first", scale: "1 primary tenant" },
  { tier: "directorate", label: "Directorate", example: "DSE / DEE / DGE / DMS / DTERT / DPSE / DNFE", scale: "7" },
  { tier: "district", label: "District", example: "Chennai, Coimbatore, Nilgiris…", scale: "38" },
  { tier: "block", label: "Block", example: "BEO / BRC", scale: "385" },
  { tier: "cluster", label: "Cluster", example: "CRC", scale: "~3,800" },
  { tier: "school", label: "School (leaf)", example: "UDISE+ school", scale: "~69,000" },
]

// Illustrative tenant hierarchy for the TN deployment.
export const DEMO_TENANTS: Tenant[] = [
  { id: "IN", tier: "national", name: "India (NDEAR)" },
  { id: "TN", tier: "state", name: "Tamil Nadu", parentId: "IN" },
  { id: "TN-DSE", tier: "directorate", name: "DSE", parentId: "TN" },
  { id: "TN-CHN", tier: "district", name: "Chennai", parentId: "TN-DSE" },
  { id: "TN-CHN-B1", tier: "block", name: "Egmore Block", parentId: "TN-CHN" },
  { id: "TN-CHN-B1-C1", tier: "cluster", name: "Cluster 1", parentId: "TN-CHN-B1" },
  { id: "TN-CHN-B1-C1-S1", tier: "school", name: "GHSS Egmore (UDISE 33010100101)", parentId: "TN-CHN-B1-C1" },
]

export function ancestorsOf(tenants: Tenant[], id: string): Tenant[] {
  const byId = new Map(tenants.map((t) => [t.id, t]))
  const chain: Tenant[] = []
  let cur = byId.get(id)
  while (cur) {
    chain.unshift(cur)
    cur = cur.parentId ? byId.get(cur.parentId) : undefined
  }
  return chain
}

/** Can `subject` tenant access `target` data? Self + ancestors (downward governance). */
export function canAccessTenant(tenants: Tenant[], subjectId: string, targetId: string): boolean {
  if (subjectId === targetId) return true
  // A tenant governs its descendants: target is accessible if subject is an ancestor.
  return ancestorsOf(tenants, targetId).some((t) => t.id === subjectId)
}

export const TENANCY_GUARANTEES: string[] = [
  "Data isolation — tenant data physically/logically separated",
  "Policy configuration within parent constraints",
  "Performance isolation — quotas prevent noisy-neighbour effects",
  "Operational autonomy — one tenant's downtime doesn't affect others",
  "Federation opt-in — cross-tenant sharing only with explicit, withdrawable consent",
  "Sovereignty preserved — state owns its data, can exit federation, data exportable",
]
