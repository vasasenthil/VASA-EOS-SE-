// VASA-EOS(SE) — government user directory with IAM bindings (Div IV / Part XVIII).
// Every category of user across the governance hierarchy, each bound to an org unit
// and to the five access models: RBAC role, ABAC attributes, ReBAC relations, with
// PBAC/CABAC evaluated by the PDP. Generates demo login credentials for the seed.
//
// SECURITY: the passwords here are DEMO credentials for a non-production seed only.
// Real deployments use SSO/Supabase Auth + MFA and never ship passwords.

import { DEFAULT_GRANTS, type GovernanceTier, type PortalRole } from "@/config/portals"
import type { Subject } from "@/lib/access"

export const DEMO_PASSWORD = "Vasa@Edu#2026"

export interface DirectoryUser {
  id: string
  name: string
  username: string
  email: string
  role: PortalRole
  tier: GovernanceTier
  orgId: string
  designation: string
  attributes?: Record<string, string | number | boolean>
  relations?: Record<string, string[]>
  status: "active" | "suspended"
}

function u(
  id: string,
  name: string,
  role: PortalRole,
  tier: GovernanceTier,
  orgId: string,
  designation: string,
  attributes?: DirectoryUser["attributes"],
  relations?: DirectoryUser["relations"],
): DirectoryUser {
  const username = id
  return { id, name, username, email: `${id}@vasa-eos.tn.gov.in`, role, tier, orgId, designation, attributes, relations, status: "active" }
}

export const DIRECTORY: DirectoryUser[] = [
  // Executive / state
  u("minister", "Hon'ble Minister (School Education)", "MINISTER", "state", "min-she", "Minister"),
  u("secretary", "Secretary, School Education", "SECRETARY", "state", "secretariat", "IAS — Secretary", { cadre: "IAS" }),
  u("admin", "Platform Administrator", "ADMIN", "state", "pmu", "System Administrator"),

  // Directorate — one Director per directorate
  u("dir-dse", "Director of School Education", "DIRECTOR", "directorate", "dse", "Director (DSE)", { directorate: "DSE" }),
  u("dir-dee", "Director of Elementary Education", "DIRECTOR", "directorate", "dee", "Director (DEE)", { directorate: "DEE" }),
  u("dir-dge", "Director of Government Examinations", "DIRECTOR", "directorate", "dge", "Director (DGE)", { directorate: "DGE" }),
  u("dir-dms", "Director of Matriculation Schools", "DIRECTOR", "directorate", "dms", "Director (DMS)", { directorate: "DMS" }),
  u("dir-dtert", "Director of Teacher Education (SCERT)", "DIRECTOR", "directorate", "dtert", "Director (DTERT)", { directorate: "DTERT" }),
  u("dir-dnfe", "Director of Non-Formal Education", "DIRECTOR", "directorate", "dnfe", "Director (DNFE)", { directorate: "DNFE" }),
  u("dir-dpse", "Director of Private Schools", "DIRECTOR", "directorate", "dpse", "Director (DPSE)", { directorate: "DPSE" }),

  // District → block → cluster → school chain (Chennai / Egmore)
  u("deo-chennai", "District Education Officer — Chennai", "DEO", "district", "deo-chennai", "DEO / CEO", { district: "Chennai" }),
  u("beo-egmore", "Block Education Officer — Egmore", "BEO", "block", "beo-egmore", "BEO", { district: "Chennai", block: "Egmore" }),
  u("crcc-egmore", "CRC Coordinator — Egmore", "CRCC", "cluster", "crc-egmore", "CRC Coordinator", { district: "Chennai", block: "Egmore", cluster: "Egmore" }),
  u("principal-egmore", "Principal — GHSS Egmore", "PRINCIPAL", "school", "ghss-egmore", "Headmaster / Principal", { school: "33010100101" }),
  u("acadhead-egmore", "Academic Head — GHSS Egmore", "ACADEMIC_HEAD", "school", "ghss-egmore", "Academic Head", { school: "33010100101" }),
  u("subinch-maths", "Subject In-charge (Maths)", "SUBJECT_INCHARGE", "school", "ghss-egmore", "Subject In-charge", { school: "33010100101", subject: "Mathematics" }),
  u("insthead-egmore", "Institution Head — GHSS Egmore", "INSTITUTION_HEAD", "school", "ghss-egmore", "Institution Head", { school: "33010100101" }),
  u(
    "teacher-egmore",
    "Teacher — Class 9-A",
    "TEACHER",
    "school",
    "ghss-egmore",
    "Graduate Assistant",
    { school: "33010100101" },
    { teaches: ["33010100101:9A"] },
  ),

  // School community
  u("student-aarthi", "Aarthi M (Class 9-A)", "STUDENT", "school", "ghss-egmore", "Student", { school: "33010100101", apaar: "APAAR-100200300401" }),
  u(
    "parent-aarthi",
    "Guardian of Aarthi M",
    "PARENT",
    "school",
    "ghss-egmore",
    "Parent / Guardian",
    { school: "33010100101" },
    { parentOf: ["APAAR-100200300401"] },
  ),

  // Ecosystem / public / national
  u("vendor-neat", "EdTech Vendor (NEAT)", "VENDOR", "national", "pmu", "NEAT Marketplace Partner"),
  u("researcher", "Education Researcher", "RESEARCHER", "national", "tnscert", "Research Fellow"),
  u("public", "Citizen / Public", "PUBLIC", "public", "min-she", "Public User"),
]

/** Build the access-control Subject (RBAC + ABAC + ReBAC) for a directory user. */
export function subjectForUser(user: DirectoryUser): Subject {
  return {
    userId: user.id,
    roles: [user.role],
    attributes: { ...(user.attributes ?? {}), suspended: user.status === "suspended" },
    relations: user.relations,
  }
}

/** The RBAC action grants a user holds (from their role). */
export function grantsForUser(user: DirectoryUser): string[] {
  return DEFAULT_GRANTS[user.role] ?? []
}

export function usersByTier(tier: GovernanceTier): DirectoryUser[] {
  return DIRECTORY.filter((d) => d.tier === tier)
}

export interface DirectorySummary {
  total: number
  roles: number
  tiers: number
}

export function directorySummary(rows: DirectoryUser[] = DIRECTORY): DirectorySummary {
  return {
    total: rows.length,
    roles: new Set(rows.map((r) => r.role)).size,
    tiers: new Set(rows.map((r) => r.tier)).size,
  }
}
