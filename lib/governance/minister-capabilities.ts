// VASA-EOS(SE) — Hon'ble Minister (School Education) capability register ("what the executive can actually do").
//
// Like the Secretary register, the honest answer to "is every Minister feature built?" — inspectable, not
// asserted. The Minister is the political/executive head (distinct from the Secretary, the administrative head):
// outcomes, schemes, constituency, election commitments, crisis response and the floor of the Assembly. Each
// general/technical/functional responsibility maps to the in-repo feature that delivers it, with an honest status:
// 'built' (a dedicated feature exists, on seeded data), 'partial' (exists but executive depth pending) or 'pending'
// (not yet built — referencing NO feature, so the register cannot fake coverage). A test keeps status and feature
// consistent. Pure + client-safe.

import {
  type CapabilityStatus,
  type CapabilityDimension,
  type RoleCapability,
  type RoleCapabilitySummary,
  roleCapabilitySummary,
  roleCapabilitiesToCSV,
} from "@/lib/governance/role-capabilities"

export type { CapabilityStatus, CapabilityDimension } from "@/lib/governance/role-capabilities"

/** A Minister capability is a role capability (see role-capabilities for the shape). */
export type MinisterCapability = RoleCapability

export const MINISTER_CAPABILITIES: MinisterCapability[] = [
  // General — executive leadership
  { id: "exec-dashboard", dimension: "general", responsibility: "Executive outcomes dashboard (schemes, constituency, crisis)", featureRef: "app/minister/dashboard/page.tsx", route: "/minister/dashboard", status: "built" },
  { id: "outcome-tracking", dimension: "general", responsibility: "NEP / SEP executive outcome tracking", featureRef: "app/tracking/dashboard/page.tsx", route: "/tracking/dashboard", status: "built" },
  { id: "constituency-view", dimension: "general", responsibility: "Constituency / stakeholder view", featureRef: "app/tracking/stakeholders/page.tsx", route: "/tracking/stakeholders", status: "built" },
  { id: "crisis-centre", dimension: "general", responsibility: "Crisis / emergency oversight", featureRef: "lib/emergency/index.ts", route: "/emergency", status: "built" },
  { id: "jurisdiction", dimension: "general", responsibility: "State executive jurisdiction", featureRef: "lib/access/scope.ts", route: "/governance/scope", status: "built" },
  { id: "cabinet-authority", dimension: "general", responsibility: "Cabinet / policy approval authority", featureRef: "lib/governance/cabinet-note.ts", route: "/governance/cabinet-note", status: "built" },

  // Technical — platform mechanisms
  { id: "exec-access", dimension: "technical", responsibility: "Executive authority via the access PDP", featureRef: "lib/access/policy.ts", route: "/governance/access", status: "built" },
  { id: "audit", dimension: "technical", responsibility: "Tamper-evident audit of executive decisions", featureRef: "lib/audit/trail.ts", route: "/governance/oversight", status: "built" },
  { id: "outcome-analytics", dimension: "technical", responsibility: "Real-time outcome analytics", featureRef: "lib/tracking/analytics.ts", route: "/tracking/analytics", status: "built" },
  { id: "identity", dimension: "technical", responsibility: "Identity & directory of the department", featureRef: "lib/directory/index.ts", route: "/governance/directory", status: "built" },

  // Functional — the executive work of the office
  { id: "scheme-impact", dimension: "functional", responsibility: "Scheme impact (CMBS / Pudhumai Penn)", featureRef: "app/schemes/page.tsx", route: "/schemes", status: "built" },
  { id: "milestones", dimension: "functional", responsibility: "Election-commitment milestone tracking", featureRef: "app/tracking/milestones/page.tsx", route: "/tracking/milestones", status: "built" },
  { id: "reports", dimension: "functional", responsibility: "Reports & benchmarking", featureRef: "app/tracking/reports/page.tsx", route: "/tracking/reports", status: "built" },
  { id: "assembly-answers", dimension: "functional", responsibility: "Assembly floor Q&A (the Minister answers)", featureRef: "lib/governance/assembly-briefing.ts", route: "/governance/assembly-briefing", status: "built" },
  { id: "budget-priorities", dimension: "functional", responsibility: "Executive budget priorities & sanction view", featureRef: "lib/finance/sanction.ts", route: "/governance/budget-sanction", status: "partial" },
  { id: "constituency-grievance", dimension: "functional", responsibility: "Constituency grievance redress", featureRef: "lib/grievance/index.ts", route: "/grievance", status: "partial" },
  { id: "scheme-launch", dimension: "functional", responsibility: "New welfare-scheme design & launch tooling", featureRef: "lib/governance/scheme-launch.ts", route: "/governance/scheme-launch", status: "built" },
  { id: "public-communication", dimension: "functional", responsibility: "Public address / press & citizen messaging", featureRef: "lib/governance/public-communication.ts", route: "/governance/public-communication", status: "built" },
]

export function capabilityById(id: string): MinisterCapability | undefined {
  return MINISTER_CAPABILITIES.find((c) => c.id === id)
}

export function byStatus(status: CapabilityStatus): MinisterCapability[] {
  return MINISTER_CAPABILITIES.filter((c) => c.status === status)
}

export function byDimension(dimension: CapabilityDimension): MinisterCapability[] {
  return MINISTER_CAPABILITIES.filter((c) => c.dimension === dimension)
}

export type MinisterCapabilitySummary = RoleCapabilitySummary

export function ministerCapabilitySummary(items: MinisterCapability[] = MINISTER_CAPABILITIES): MinisterCapabilitySummary {
  return roleCapabilitySummary(items)
}

export function toCSV(items: MinisterCapability[] = MINISTER_CAPABILITIES): string {
  return roleCapabilitiesToCSV(items)
}
