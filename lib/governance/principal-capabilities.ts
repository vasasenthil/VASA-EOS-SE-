// VASA-EOS(SE) — School Head (Principal / Headmaster) capability register.
//
// The honest, inspectable answer to "is every school-head feature built?" — for the role that runs the school
// at the bottom of the tenancy tree. Each general/technical/functional responsibility maps to the in-repo
// feature delivering it, with the same candid built/partial/pending status and the same anti-overclaim
// invariant as the Secretary, Minister and Director registers. Built on the shared role-capabilities helper.
// Pure + client-safe.

import {
  type CapabilityStatus,
  type CapabilityDimension,
  type RoleCapability,
  type RoleCapabilitySummary,
  roleCapabilitySummary,
  roleCapabilitiesToCSV,
} from "@/lib/governance/role-capabilities"

export type { CapabilityStatus, CapabilityDimension } from "@/lib/governance/role-capabilities"

/** A Principal capability is a role capability (see role-capabilities for the shape). */
export type PrincipalCapability = RoleCapability

export const PRINCIPAL_CAPABILITIES: PrincipalCapability[] = [
  // General — school leadership
  { id: "principal-dashboard", dimension: "general", responsibility: "Principal dashboard & whole-school operations", featureRef: "app/(dashboards)/principal/dashboard/page.tsx", route: "/principal/dashboard", status: "built" },
  { id: "school-compliance", dimension: "general", responsibility: "School compliance (RTE / safety / statutory)", featureRef: "app/principal/compliance/page.tsx", route: "/principal/compliance", status: "built" },
  { id: "school-scope", dimension: "general", responsibility: "School-tier jurisdiction (rooted at the school node)", featureRef: "lib/access/scope.ts", route: "/governance/scope", status: "built" },
  { id: "smc-governance", dimension: "general", responsibility: "School Management Committee governance", featureRef: "lib/smc/index.ts", route: "/smc", status: "built" },
  { id: "announcements", dimension: "general", responsibility: "School announcements & notices", featureRef: "app/principal/announcements/page.tsx", route: "/principal/announcements", status: "built" },

  // Technical — platform mechanisms
  { id: "access-pdp", dimension: "technical", responsibility: "School authority via the access PDP", featureRef: "lib/access/policy.ts", route: "/governance/access", status: "built" },
  { id: "audit", dimension: "technical", responsibility: "Tamper-evident audit of school records", featureRef: "lib/audit/trail.ts", route: "/governance/oversight", status: "built" },
  { id: "pii-consent", dimension: "technical", responsibility: "Student-PII classification & consent gating", featureRef: "lib/consent/pii-catalogue.ts", route: "/governance/pii-catalogue", status: "built" },

  // Functional — running the school
  { id: "student-management", dimension: "functional", responsibility: "Student roster & information management", featureRef: "app/principal/students/page.tsx", route: "/principal/students", status: "built" },
  { id: "staff-management", dimension: "functional", responsibility: "Staff management & deployment", featureRef: "app/principal/staff/page.tsx", route: "/principal/staff", status: "built" },
  { id: "attendance", dimension: "functional", responsibility: "Student & staff attendance", featureRef: "lib/attendance/index.ts", route: "/attendance", status: "built" },
  { id: "timetable", dimension: "functional", responsibility: "Timetable & substitution", featureRef: "lib/timetable/index.ts", route: "/timetable", status: "built" },
  { id: "assessment-hpc", dimension: "functional", responsibility: "Assessment & holistic progress card", featureRef: "lib/hpc/index.ts", route: "/hpc", status: "built" },
  { id: "fee-management", dimension: "functional", responsibility: "Fee management", featureRef: "app/principal/fee-management/page.tsx", route: "/principal/fee-management", status: "built" },
  { id: "discipline-safety", dimension: "functional", responsibility: "Discipline & student safety", featureRef: "lib/discipline/index.ts", route: "/discipline", status: "built" },
  { id: "school-health", dimension: "functional", responsibility: "School health & RBSK screening", featureRef: "app/principal/health/page.tsx", route: "/principal/health", status: "built" },
  { id: "parent-engagement", dimension: "functional", responsibility: "Parent-teacher meetings & engagement", featureRef: "lib/ptm/index.ts", route: "/ptm", status: "built" },
  { id: "library-meals-ops", dimension: "functional", responsibility: "Library & mid-day-meal operations oversight", featureRef: "lib/governance/school-welfare-ops.ts", route: "/governance/school-welfare-ops", status: "built" },
  { id: "school-self-assessment", dimension: "functional", responsibility: "School self-assessment (SQAAF / Shaala Siddhi)", featureRef: "lib/governance/school-self-assessment.ts", route: "/governance/school-self-assessment", status: "built" },
]

export function capabilityById(id: string): PrincipalCapability | undefined {
  return PRINCIPAL_CAPABILITIES.find((c) => c.id === id)
}

export function byStatus(status: CapabilityStatus): PrincipalCapability[] {
  return PRINCIPAL_CAPABILITIES.filter((c) => c.status === status)
}

export function byDimension(dimension: CapabilityDimension): PrincipalCapability[] {
  return PRINCIPAL_CAPABILITIES.filter((c) => c.dimension === dimension)
}

export type PrincipalCapabilitySummary = RoleCapabilitySummary

export function principalCapabilitySummary(items: PrincipalCapability[] = PRINCIPAL_CAPABILITIES): PrincipalCapabilitySummary {
  return roleCapabilitySummary(items)
}

export function toCSV(items: PrincipalCapability[] = PRINCIPAL_CAPABILITIES): string {
  return roleCapabilitiesToCSV(items)
}
