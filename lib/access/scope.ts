// VASA-EOS(SE) — per-role data scoping (ReBAC jurisdiction, Part XIII multi-tenancy).
//
// The PDP (lib/access) answers "may this role perform this action?". Scoping answers
// the orthogonal question "which RECORDS may this subject see?" — the downward-
// governance rule from lib/tenancy made operational over data: a subject governs its
// own tenant node and every descendant, and nothing above or sideways. A Principal
// sees one school; a BEO sees a block's schools; a DEO a district; the State sees all.
//
// Pure and self-contained (no server imports) so it is fully testable and safe to use
// from any layer. The demo tenant tree + records below let the Scope Explorer show the
// rule narrowing real data as you switch role.

import { ancestorsOf, canAccessTenant, type Tenant } from "@/lib/tenancy"
import type { PortalRole } from "@/config/portals"

export interface Scoped {
  /** The tenant node this record belongs to. */
  tenantId: string
}

// Default leaf school for records created in the demo (until a real posting node is
// resolved). A school-tier node so school roles see their own data immediately.
export const DEFAULT_SCHOOL_NODE = "TN-CHN-B1-S1"

/** A record is visible iff the subject governs its node (self or an ancestor). */
export function inJurisdiction(tenants: Tenant[], subjectTenantId: string, recordTenantId: string): boolean {
  return canAccessTenant(tenants, subjectTenantId, recordTenantId)
}

/** Filter any scoped dataset to the records a subject may see. */
export function scopeRecords<T extends Scoped>(tenants: Tenant[], subjectTenantId: string, records: T[]): T[] {
  return records.filter((r) => inJurisdiction(tenants, subjectTenantId, r.tenantId))
}

/** Every tenant id a subject governs (its own node + all descendants). */
export function visibleTenantIds(tenants: Tenant[], subjectTenantId: string): string[] {
  return tenants.filter((t) => canAccessTenant(tenants, subjectTenantId, t.id)).map((t) => t.id)
}

/** Human jurisdiction label: the subject node's name + how many nodes it governs. */
export function jurisdictionLabel(tenants: Tenant[], subjectTenantId: string): string {
  const node = tenants.find((t) => t.id === subjectTenantId)
  if (!node) return "No jurisdiction"
  const governed = visibleTenantIds(tenants, subjectTenantId).length
  return `${node.name} — governs ${governed} node${governed === 1 ? "" : "s"}`
}

// ── Demo jurisdiction binding ────────────────────────────────────────────────
// Maps each portal role to its tenant node in the demo tree below. Production
// resolves this from the user's posting (org assignment); the binding shape is the
// same — a role at a tier anchored to a node.
export const ROLE_NODE: Partial<Record<PortalRole, string>> = {
  MINISTER: "TN",
  SECRETARY: "TN",
  ADMIN: "TN",
  DIRECTOR: "TN-DSE",
  DEO: "TN-CHN",
  BEO: "TN-CHN-B1",
  CRCC: "TN-CHN-B1",
  ACADEMIC_HEAD: "TN-CHN-B1-S1",
  PRINCIPAL: "TN-CHN-B1-S1",
  TEACHER: "TN-CHN-B1-S1",
  STUDENT: "TN-CHN-B1-S1",
  PARENT: "TN-CHN-B1-S1",
}

/** The node a role is anchored to, or undefined for roles outside the hierarchy. */
export function nodeForRole(role: string | null | undefined): string | undefined {
  return role ? ROLE_NODE[role as PortalRole] : undefined
}

// A small but realistic TN slice: one directorate → two districts → blocks → schools.
export const SCOPE_TENANTS: Tenant[] = [
  { id: "TN", tier: "state", name: "Tamil Nadu" },
  { id: "TN-DSE", tier: "directorate", name: "Directorate of School Education", parentId: "TN" },
  { id: "TN-CHN", tier: "district", name: "Chennai", parentId: "TN-DSE" },
  { id: "TN-CHN-B1", tier: "block", name: "Egmore Block", parentId: "TN-CHN" },
  { id: "TN-CHN-B1-S1", tier: "school", name: "GHSS Egmore", parentId: "TN-CHN-B1" },
  { id: "TN-CHN-B1-S2", tier: "school", name: "GGHSS Egmore", parentId: "TN-CHN-B1" },
  { id: "TN-CHN-B2", tier: "block", name: "Adyar Block", parentId: "TN-CHN" },
  { id: "TN-CHN-B2-S1", tier: "school", name: "GHSS Adyar", parentId: "TN-CHN-B2" },
  { id: "TN-CBE", tier: "district", name: "Coimbatore", parentId: "TN-DSE" },
  { id: "TN-CBE-B1", tier: "block", name: "Gandhipuram Block", parentId: "TN-CBE" },
  { id: "TN-CBE-B1-S1", tier: "school", name: "GHSS Gandhipuram", parentId: "TN-CBE-B1" },
]

export interface ScopedSchool extends Scoped {
  id: string
  name: string
  enrolment: number
  attendancePct: number
}

// One enrolment record per school node — the data scoping narrows as role changes.
export const SCOPE_RECORDS: ScopedSchool[] = [
  { id: "S-EGM-1", name: "GHSS Egmore", enrolment: 1240, attendancePct: 94, tenantId: "TN-CHN-B1-S1" },
  { id: "S-EGM-2", name: "GGHSS Egmore", enrolment: 980, attendancePct: 92, tenantId: "TN-CHN-B1-S2" },
  { id: "S-ADY-1", name: "GHSS Adyar", enrolment: 1510, attendancePct: 95, tenantId: "TN-CHN-B2-S1" },
  { id: "S-GPM-1", name: "GHSS Gandhipuram", enrolment: 1320, attendancePct: 91, tenantId: "TN-CBE-B1-S1" },
]

export interface ScopeBreakdownRow {
  role: PortalRole
  node: string
  nodeName: string
  visibleNodes: number
  visibleRecords: number
}

/** What each anchored role can see — the demonstrable scoping matrix. */
export function scopeBreakdown(
  tenants: Tenant[] = SCOPE_TENANTS,
  records: Scoped[] = SCOPE_RECORDS,
): ScopeBreakdownRow[] {
  const byId = new Map(tenants.map((t) => [t.id, t]))
  return (Object.keys(ROLE_NODE) as PortalRole[])
    .map((role) => {
      const node = ROLE_NODE[role] as string
      return {
        role,
        node,
        nodeName: byId.get(node)?.name ?? node,
        visibleNodes: visibleTenantIds(tenants, node).length,
        visibleRecords: scopeRecords(tenants, node, records as ScopedSchool[]).length,
      }
    })
    .sort((a, b) => b.visibleRecords - a.visibleRecords || a.role.localeCompare(b.role))
}

export { ancestorsOf }
