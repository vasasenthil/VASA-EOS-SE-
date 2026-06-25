// VASA-EOS(SE) — cross-tier coverage inventory (the whole org chart, honestly).
//
// "Have you built general/technical/functional features for State/Executive, every Directorate, District,
// Block, Cluster, School and the Citizen?" — answered as an omission-free, inspectable inventory rather than a
// claim. For each tenancy tier this maps representative capabilities to the in-repo feature delivering them,
// with an honest built/partial/pending status. It does NOT pretend completeness: where a tier still lacks a
// dedicated capability (e.g. a Director/School honest-coverage register like the Secretary's), it is openly
// pending and references no feature. A test keeps status and feature consistent and asserts every tier is
// represented. Mirrors the live tenancy tree (national → state → directorate → district → block → cluster →
// school) rooted at TN. Pure + client-safe.

import { csvField } from "@/lib/csv"

import { type CapabilityStatus, type CapabilityDimension } from "@/lib/governance/role-capabilities"

export const TIERS = [
  "State / Executive",
  "Directorate",
  "District",
  "Block",
  "Cluster",
  "School",
  "Citizen",
] as const

export type Tier = (typeof TIERS)[number]

export interface TierCapability {
  tier: Tier
  /** Representative role at this tier. */
  role: string
  dimension: CapabilityDimension
  responsibility: string
  /** In-repo feature delivering it — empty when pending. */
  featureRef: string
  route: string
  status: CapabilityStatus
}

export const TIER_CAPABILITIES: TierCapability[] = [
  // State / Executive — Minister & Secretary (detailed registers exist)
  { tier: "State / Executive", role: "Secretary / Minister", dimension: "general", responsibility: "Executive & administrative command (detailed role registers)", featureRef: "lib/governance/secretary-capabilities.ts", route: "/governance/secretary-capabilities", status: "built" },
  { tier: "State / Executive", role: "Minister", dimension: "functional", responsibility: "Cabinet, Assembly, scheme-launch & press tooling", featureRef: "lib/governance/scheme-launch.ts", route: "/governance/scheme-launch", status: "built" },
  { tier: "State / Executive", role: "Secretary", dimension: "functional", responsibility: "Budget sanction & financial transparency", featureRef: "lib/finance/sanction.ts", route: "/governance/budget-sanction", status: "built" },
  { tier: "State / Executive", role: "Secretary / Minister", dimension: "technical", responsibility: "State-tier jurisdiction (ReBAC downward governance)", featureRef: "lib/access/scope.ts", route: "/governance/scope", status: "built" },

  // Directorate — Director (covers all 7 directorates via one portal)
  { tier: "Directorate", role: "Director", dimension: "general", responsibility: "Directorate dashboard (all 7 directorates)", featureRef: "app/director/dashboard/page.tsx", route: "/director/dashboard", status: "built" },
  { tier: "Directorate", role: "Director", dimension: "functional", responsibility: "School recognition pipeline (TN 1973)", featureRef: "lib/recognition/index.ts", route: "/recognition", status: "built" },
  { tier: "Directorate", role: "Director", dimension: "functional", responsibility: "Quality & inspection oversight", featureRef: "lib/quality/index.ts", route: "/quality", status: "built" },
  { tier: "Directorate", role: "Director", dimension: "functional", responsibility: "Policy-implementation (NEP) tracking", featureRef: "lib/tracking/analytics.ts", route: "/tracking/dashboard", status: "built" },
  { tier: "Directorate", role: "Director", dimension: "general", responsibility: "Director honest capability register (like the Secretary's)", featureRef: "lib/governance/director-capabilities.ts", route: "/governance/director-capabilities", status: "built" },

  // District — DEO / CEO
  { tier: "District", role: "DEO / CEO", dimension: "general", responsibility: "District KPI dashboard & heat maps", featureRef: "app/deo/dashboard/page.tsx", route: "/deo/dashboard", status: "built" },
  { tier: "District", role: "DEO", dimension: "functional", responsibility: "Recognition approvals (DEO scrutiny)", featureRef: "app/recognition-approvals/page.tsx", route: "/recognition-approvals", status: "built" },
  { tier: "District", role: "DEO", dimension: "functional", responsibility: "Teacher deployment & vacancy", featureRef: "lib/vacancy/index.ts", route: "/vacancy", status: "built" },
  { tier: "District", role: "DEO", dimension: "functional", responsibility: "District grievance redress", featureRef: "lib/grievance/index.ts", route: "/grievance", status: "built" },

  // Block — BEO
  { tier: "Block", role: "BEO", dimension: "general", responsibility: "Block operations dashboard", featureRef: "app/beo/dashboard/page.tsx", route: "/beo/dashboard", status: "built" },
  { tier: "Block", role: "BEO", dimension: "functional", responsibility: "AI-prioritised inspections", featureRef: "lib/inspection/index.ts", route: "/inspections", status: "built" },
  { tier: "Block", role: "BEO", dimension: "functional", responsibility: "Leave approvals (block tier)", featureRef: "app/leave-approvals/page.tsx", route: "/leave-approvals", status: "built" },
  { tier: "Block", role: "BEO", dimension: "functional", responsibility: "Scheme implementation", featureRef: "app/schemes/page.tsx", route: "/schemes", status: "built" },

  // Cluster — CRCC
  { tier: "Cluster", role: "CRCC", dimension: "general", responsibility: "Cluster dashboard & mentoring queue", featureRef: "app/crcc/dashboard/page.tsx", route: "/crcc/dashboard", status: "built" },
  { tier: "Cluster", role: "CRCC", dimension: "functional", responsibility: "Teacher mentoring (CPD)", featureRef: "lib/cpd/index.ts", route: "/cpd", status: "built" },
  { tier: "Cluster", role: "CRCC", dimension: "functional", responsibility: "NIPUN / diagnostic tracking", featureRef: "lib/diagnostic/index.ts", route: "/diagnostic", status: "built" },
  { tier: "Cluster", role: "CRCC", dimension: "functional", responsibility: "Reading campaign & remedial (FLN)", featureRef: "lib/reading/index.ts", route: "/reading", status: "built" },

  // School — Principal / Head
  { tier: "School", role: "Principal", dimension: "general", responsibility: "Principal dashboard & school operations", featureRef: "app/(dashboards)/principal/dashboard/page.tsx", route: "/principal/dashboard", status: "built" },
  { tier: "School", role: "Principal", dimension: "functional", responsibility: "Attendance & student information", featureRef: "lib/attendance/index.ts", route: "/attendance", status: "built" },
  { tier: "School", role: "Principal", dimension: "functional", responsibility: "School compliance", featureRef: "app/principal/compliance/page.tsx", route: "/principal/compliance", status: "built" },
  { tier: "School", role: "Principal", dimension: "functional", responsibility: "Fee management", featureRef: "app/principal/fee-management/page.tsx", route: "/principal/fee-management", status: "built" },
  { tier: "School", role: "Principal", dimension: "general", responsibility: "School-head honest capability register (like the Secretary's)", featureRef: "lib/governance/principal-capabilities.ts", route: "/governance/principal-capabilities", status: "built" },

  // Citizen — Public / Parent
  { tier: "Citizen", role: "Public / Parent", dimension: "general", responsibility: "Citizen transparency dashboard", featureRef: "app/public/dashboard/page.tsx", route: "/public/dashboard", status: "built" },
  { tier: "Citizen", role: "Public", dimension: "functional", responsibility: "School registry / finder (UDISE+)", featureRef: "app/school-registry/page.tsx", route: "/school-registry", status: "built" },
  { tier: "Citizen", role: "Public", dimension: "functional", responsibility: "RTI register", featureRef: "lib/rti/index.ts", route: "/rti", status: "built" },
  { tier: "Citizen", role: "Public / Parent", dimension: "functional", responsibility: "Citizen feedback & grievances", featureRef: "lib/feedback/index.ts", route: "/feedback", status: "built" },
  { tier: "Citizen", role: "Public", dimension: "technical", responsibility: "Citizen-tier read-only access (PDP)", featureRef: "lib/access/policy.ts", route: "/governance/access", status: "built" },
]

export function byTier(tier: Tier): TierCapability[] {
  return TIER_CAPABILITIES.filter((c) => c.tier === tier)
}

export function byStatus(status: CapabilityStatus): TierCapability[] {
  return TIER_CAPABILITIES.filter((c) => c.status === status)
}

export interface TierCoverage {
  tier: Tier
  capabilities: number
  built: number
  partial: number
  pending: number
  builtPct: number
}

export function coverageByTier(items: TierCapability[] = TIER_CAPABILITIES): TierCoverage[] {
  return TIERS.map((tier) => {
    const rows = items.filter((c) => c.tier === tier)
    const built = rows.filter((c) => c.status === "built").length
    return {
      tier,
      capabilities: rows.length,
      built,
      partial: rows.filter((c) => c.status === "partial").length,
      pending: rows.filter((c) => c.status === "pending").length,
      builtPct: rows.length === 0 ? 0 : Math.round((built / rows.length) * 100),
    }
  })
}

export interface TierCoverageSummary {
  tiers: number
  capabilities: number
  built: number
  partial: number
  pending: number
  builtPct: number
}

export function tierCoverageSummary(items: TierCapability[] = TIER_CAPABILITIES): TierCoverageSummary {
  const built = items.filter((c) => c.status === "built").length
  return {
    tiers: TIERS.length,
    capabilities: items.length,
    built,
    partial: items.filter((c) => c.status === "partial").length,
    pending: items.filter((c) => c.status === "pending").length,
    builtPct: items.length === 0 ? 0 : Math.round((built / items.length) * 100),
  }
}


export function toCSV(items: TierCapability[] = TIER_CAPABILITIES): string {
  const header = ["Tier", "Role", "Dimension", "Responsibility", "Feature", "Route", "Status"]
  const rows = items.map((c) => [c.tier, c.role, c.dimension, c.responsibility, c.featureRef || "—", c.route || "—", c.status].map(csvField).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
