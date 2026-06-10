// VASA-EOS(SE) — State Director (Directorate) capability register.
//
// The honest, inspectable answer to "is every Director feature built?" — for the role that runs a Directorate
// and, through one portal, stands in for all seven (DSE, DEE, DGE, DTERT/SCERT, ELCTSL, Library, NMM-style
// directorates). Each general/technical/functional responsibility maps to the in-repo feature delivering it,
// with the same candid built/partial/pending status and the same anti-overclaim invariant as the Secretary and
// Minister registers. Built on the shared role-capabilities helper. Pure + client-safe.

import {
  type CapabilityStatus,
  type CapabilityDimension,
  type RoleCapability,
  type RoleCapabilitySummary,
  roleCapabilitySummary,
  roleCapabilitiesToCSV,
} from "@/lib/governance/role-capabilities"

export type { CapabilityStatus, CapabilityDimension } from "@/lib/governance/role-capabilities"

/** A Director capability is a role capability (see role-capabilities for the shape). */
export type DirectorCapability = RoleCapability

export const DIRECTOR_CAPABILITIES: DirectorCapability[] = [
  // General — directorate leadership
  { id: "directorate-dashboard", dimension: "general", responsibility: "Directorate operations dashboard (all 7 directorates)", featureRef: "app/director/dashboard/page.tsx", route: "/director/dashboard", status: "built" },
  { id: "governance-overview", dimension: "general", responsibility: "All-directorate governance overview", featureRef: "app/governance/dashboard/page.tsx", route: "/governance/dashboard", status: "built" },
  { id: "directorate-scope", dimension: "general", responsibility: "Directorate jurisdiction (rooted at TN-DSE)", featureRef: "lib/access/scope.ts", route: "/governance/scope", status: "built" },
  { id: "forum-participation", dimension: "general", responsibility: "Directorate forum / RACI participation", featureRef: "app/governance/forums/page.tsx", route: "/governance/forums", status: "built" },
  { id: "recognition-authority", dimension: "general", responsibility: "School recognition authority (TN 1973)", featureRef: "lib/recognition/index.ts", route: "/recognition", status: "built" },

  // Technical — platform mechanisms
  { id: "access-pdp", dimension: "technical", responsibility: "Directorate authority via the access PDP", featureRef: "lib/access/policy.ts", route: "/governance/access", status: "built" },
  { id: "audit", dimension: "technical", responsibility: "Tamper-evident audit of directorate decisions", featureRef: "lib/audit/trail.ts", route: "/governance/oversight", status: "built" },
  { id: "analytics", dimension: "technical", responsibility: "Directorate outcome analytics", featureRef: "lib/tracking/analytics.ts", route: "/tracking/analytics", status: "built" },
  { id: "recognition-clock", dimension: "technical", responsibility: "Recognition statutory-clock oversight", featureRef: "lib/recognition/oversight.ts", route: "/governance/recognition-oversight", status: "built" },

  // Functional — directorate work
  { id: "quality-inspection", dimension: "functional", responsibility: "Quality & inspection oversight", featureRef: "lib/quality/index.ts", route: "/quality", status: "built" },
  { id: "policy-tracking", dimension: "functional", responsibility: "Policy-implementation (NEP) tracking", featureRef: "app/tracking/dashboard/page.tsx", route: "/tracking/dashboard", status: "built" },
  { id: "scheme-implementation", dimension: "functional", responsibility: "Scheme implementation across districts", featureRef: "app/schemes/page.tsx", route: "/schemes", status: "built" },
  { id: "reports-benchmarking", dimension: "functional", responsibility: "Reports & benchmarking", featureRef: "app/tracking/reports/page.tsx", route: "/tracking/reports", status: "built" },
  { id: "cadre-deployment", dimension: "functional", responsibility: "Teacher cadre / PTR deployment", featureRef: "lib/postings/cadre.ts", route: "/governance/cadre-rationalisation", status: "built" },
  { id: "teacher-vacancy", dimension: "functional", responsibility: "Teacher vacancy tracking", featureRef: "lib/vacancy/index.ts", route: "/vacancy", status: "built" },
  { id: "budget-allocation", dimension: "functional", responsibility: "Directorate budget & resource allocation across districts", featureRef: "lib/finance/index.ts", route: "/governance/budget-sanction", status: "partial" },
  { id: "directorate-specialisation", dimension: "functional", responsibility: "Per-directorate specialised ops (DGE exams, SCERT curriculum, ELCTSL, Library…)", featureRef: "lib/governance/directorates.ts", route: "/governance/directorates", status: "built" },
]

export function capabilityById(id: string): DirectorCapability | undefined {
  return DIRECTOR_CAPABILITIES.find((c) => c.id === id)
}

export function byStatus(status: CapabilityStatus): DirectorCapability[] {
  return DIRECTOR_CAPABILITIES.filter((c) => c.status === status)
}

export function byDimension(dimension: CapabilityDimension): DirectorCapability[] {
  return DIRECTOR_CAPABILITIES.filter((c) => c.dimension === dimension)
}

export type DirectorCapabilitySummary = RoleCapabilitySummary

export function directorCapabilitySummary(items: DirectorCapability[] = DIRECTOR_CAPABILITIES): DirectorCapabilitySummary {
  return roleCapabilitySummary(items)
}

export function toCSV(items: DirectorCapability[] = DIRECTOR_CAPABILITIES): string {
  return roleCapabilitiesToCSV(items)
}
