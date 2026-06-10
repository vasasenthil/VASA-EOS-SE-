// VASA-EOS(SE) — jurisdiction tier catalogue (Multi-Tenancy pillar).
//
// Makes the seven-tier sovereign tenancy inspectable: each tier (national → state →
// directorate → district → block → cluster → school) with its TN-scale and the live demo
// node that sits at that level, plus the downward-governance semantics (a tenant governs
// itself and its descendants). Composed from TENANT_TIERS and the DEMO_TENANTS tree, and
// self-verified: the tree is a complete, strictly-descending chain and downward governance
// holds. TN is the primary sovereign tenant today; the model already anchors states under
// a national node so more states / the Centre can be added later. Pure + client-safe.

import { csvField } from "@/lib/csv"

import { TENANT_TIERS, DEMO_TENANTS, ancestorsOf, canAccessTenant, type TenantTier, type Tenant } from "./index"

export const TIER_ORDER: TenantTier[] = [
  "national",
  "state",
  "directorate",
  "district",
  "block",
  "cluster",
  "school",
]

export function tierLevel(tier: TenantTier): number {
  return TIER_ORDER.indexOf(tier)
}

export interface TierRow {
  tier: TenantTier
  label: string
  example: string
  scale: string
  /** Depth 0 (national) … 6 (school). */
  level: number
  /** The live demo node at this tier, if present. */
  node?: Tenant
}

export function tierCatalogue(): TierRow[] {
  return TENANT_TIERS.map((t) => ({
    tier: t.tier,
    label: t.label,
    example: t.example,
    scale: t.scale,
    level: tierLevel(t.tier),
    node: DEMO_TENANTS.find((n) => n.tier === t.tier),
  }))
}

/** The leaf school node of the demo tree (deepest tier present). */
export function leafNode(): Tenant | undefined {
  return [...DEMO_TENANTS].sort((a, b) => tierLevel(b.tier) - tierLevel(a.tier))[0]
}

/** The governance path from national root down to the demo school leaf. */
export function governancePath(): Tenant[] {
  const leaf = leafNode()
  return leaf ? ancestorsOf(DEMO_TENANTS, leaf.id) : []
}

/**
 * Structural problems in the demo tree: a missing parent, or a parent that is not exactly
 * one tier above its child (chain must be strictly descending). Empty when well-formed.
 */
export function treeViolations(): string[] {
  const byId = new Map(DEMO_TENANTS.map((t) => [t.id, t]))
  const issues: string[] = []
  for (const n of DEMO_TENANTS) {
    if (!n.parentId) {
      if (n.tier !== "national") issues.push(`${n.id} has no parent but is not national`)
      continue
    }
    const parent = byId.get(n.parentId)
    if (!parent) {
      issues.push(`${n.id} → missing parent ${n.parentId}`)
      continue
    }
    if (tierLevel(parent.tier) !== tierLevel(n.tier) - 1) {
      issues.push(`${n.id} (${n.tier}) parent ${parent.id} is not the tier directly above`)
    }
  }
  return issues
}

export interface TenancySummary {
  tiers: number
  demoNodes: number
  /** Depth of the governance path (national..school). */
  depth: number
  sovereignState: string
}

export function tenancySummary(): TenancySummary {
  return {
    tiers: TENANT_TIERS.length,
    demoNodes: DEMO_TENANTS.length,
    depth: governancePath().length,
    sovereignState: DEMO_TENANTS.find((t) => t.tier === "state")?.name ?? "—",
  }
}

export { canAccessTenant }


export function toCSV(rows: TierRow[] = tierCatalogue()): string {
  const header = ["Level", "Tier", "Label", "TN scale", "Demo node"]
  const out = rows.map((r) => [String(r.level), r.tier, r.label, r.scale, r.node?.name ?? "—"].map(csvField).join(","))
  return [header.join(","), ...out].join("\r\n") + "\r\n"
}
