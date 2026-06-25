// VASA-EOS(SE) — Tamil Nadu school-education governance structure (Part VI/XIII/XVIII).
// The ministries, secretariat, directorates, authorities/organisations, councils,
// committees and field offices the platform governs, with their tier and hierarchy.
// Pure data + helpers; surfaced at /governance/org and used to scope the directory.

import type { GovernanceTier } from "@/config/portals"

export type OrgKind =
  | "ministry"
  | "secretariat"
  | "directorate"
  | "authority"
  | "council"
  | "committee"
  | "office"
  | "school"

export const ORG_KIND_LABELS: Record<OrgKind, string> = {
  ministry: "Ministry / Department",
  secretariat: "Secretariat",
  directorate: "Directorate",
  authority: "Authority / Organisation",
  council: "Council",
  committee: "Committee",
  office: "Field Office",
  school: "School",
}

export interface OrgUnit {
  id: string
  name: string
  code?: string
  kind: OrgKind
  tier: GovernanceTier
  parentId?: string
}

export const ORG_UNITS: OrgUnit[] = [
  // Apex
  { id: "min-she", name: "School Education Department, Govt of Tamil Nadu", code: "SHE", kind: "ministry", tier: "state" },
  { id: "secretariat", name: "School Education Secretariat (Fort St. George)", kind: "secretariat", tier: "state", parentId: "min-she" },

  // The 7 directorates
  { id: "dse", name: "Directorate of School Education", code: "DSE", kind: "directorate", tier: "directorate", parentId: "secretariat" },
  { id: "dee", name: "Directorate of Elementary Education", code: "DEE", kind: "directorate", tier: "directorate", parentId: "secretariat" },
  { id: "dge", name: "Directorate of Government Examinations", code: "DGE", kind: "directorate", tier: "directorate", parentId: "secretariat" },
  { id: "dms", name: "Directorate of Matriculation Schools", code: "DMS", kind: "directorate", tier: "directorate", parentId: "secretariat" },
  { id: "dtert", name: "Directorate of Teacher Education, Research & Training (SCERT)", code: "DTERT", kind: "directorate", tier: "directorate", parentId: "secretariat" },
  { id: "dnfe", name: "Directorate of Non-Formal & Adult Education", code: "DNFE", kind: "directorate", tier: "directorate", parentId: "secretariat" },
  { id: "dpse", name: "Directorate of Private Schools & Pre-Primary Education", code: "DPSE", kind: "directorate", tier: "directorate", parentId: "secretariat" },

  // Authorities / organisations
  { id: "samagra", name: "Samagra Shiksha Tamil Nadu (State Project Directorate)", code: "SSA-TN", kind: "authority", tier: "state", parentId: "min-she" },
  { id: "tnscert", name: "TN State Council of Educational Research & Training", code: "TNSCERT", kind: "authority", tier: "state", parentId: "dtert" },
  { id: "ttbc", name: "TN Text Book & Educational Services Corporation", code: "TNTBESC", kind: "authority", tier: "state", parentId: "min-she" },
  { id: "trb", name: "Teachers Recruitment Board", code: "TRB", kind: "authority", tier: "state", parentId: "min-she" },
  { id: "tnsdma", name: "TN State Disaster Management Authority", code: "TNSDMA", kind: "authority", tier: "state" },
  { id: "dpl", name: "Directorate of Public Libraries", code: "DPL", kind: "authority", tier: "state", parentId: "min-she" },
  { id: "pmu", name: "VASA-EOS Programme Management Unit", code: "PMU", kind: "authority", tier: "state", parentId: "min-she" },

  // Councils
  { id: "steering", name: "State Steering Committee", kind: "council", tier: "state", parentId: "min-she" },
  { id: "curriculum", name: "State Curriculum Committee", kind: "council", tier: "state", parentId: "tnscert" },
  { id: "academic", name: "State Academic Council", kind: "council", tier: "state", parentId: "dse" },

  // Committees (cross-tier)
  { id: "dec", name: "District Education Committee", kind: "committee", tier: "district" },
  { id: "brc-com", name: "Block Resource Committee", kind: "committee", tier: "block" },
  { id: "crc-com", name: "Cluster Resource Centre Committee", kind: "committee", tier: "cluster" },
  { id: "smc", name: "School Management Committee (SMC)", kind: "committee", tier: "school" },
  { id: "pta", name: "Parent-Teacher Association (PTA)", kind: "committee", tier: "school" },
  { id: "grc", name: "School Grievance Redressal Committee", kind: "committee", tier: "school" },

  // Field offices + a sample school
  { id: "deo-chennai", name: "District Education Office — Chennai", kind: "office", tier: "district", parentId: "dse" },
  { id: "beo-egmore", name: "Block Education Office — Egmore", kind: "office", tier: "block", parentId: "deo-chennai" },
  { id: "crc-egmore", name: "Cluster Resource Centre — Egmore", kind: "office", tier: "cluster", parentId: "beo-egmore" },
  { id: "ghss-egmore", name: "GHSS Egmore", code: "33010100101", kind: "school", tier: "school", parentId: "crc-egmore" },
]

const byId = new Map(ORG_UNITS.map((o) => [o.id, o]))

export function getOrg(id: string): OrgUnit | undefined {
  return byId.get(id)
}

export function orgsByKind(kind: OrgKind): OrgUnit[] {
  return ORG_UNITS.filter((o) => o.kind === kind)
}

export function childrenOf(id: string): OrgUnit[] {
  return ORG_UNITS.filter((o) => o.parentId === id)
}

/** Root-to-node parent chain (inclusive). */
export function orgPath(id: string): OrgUnit[] {
  const chain: OrgUnit[] = []
  let cur = byId.get(id)
  while (cur) {
    chain.unshift(cur)
    cur = cur.parentId ? byId.get(cur.parentId) : undefined
  }
  return chain
}

export interface OrgSummary {
  total: number
  byKind: Record<OrgKind, number>
}

export function orgSummary(units: OrgUnit[] = ORG_UNITS): OrgSummary {
  const byKind = Object.fromEntries((Object.keys(ORG_KIND_LABELS) as OrgKind[]).map((k) => [k, 0])) as Record<OrgKind, number>
  for (const o of units) byKind[o.kind] += 1
  return { total: units.length, byKind }
}
