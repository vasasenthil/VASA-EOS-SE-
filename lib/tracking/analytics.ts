// VASA-EOS(SE) — NEP/SEP implementation analytics (pure, demo-safe).
//
// Richer derived analytics over policy-implementation rows: status mix, RAG bands,
// thrust-area and region-type rollups, and an at-risk list. Pure and seed-backed so
// the analytics view renders with meaningful numbers even with no database attached
// (the production tracker dashboard reads the same shapes from Supabase).

export type ImplStatus = "Not Started" | "In Progress" | "On Track" | "Delayed" | "Completed"
export type RagBand = "Red" | "Amber" | "Green"

export interface ImplRow {
  policyId: string
  policy: string
  /** NEP thrust area, e.g. "Foundational Literacy & Numeracy". */
  thrustArea: string
  region: string
  regionType: "State" | "District" | "Block"
  status: ImplStatus
  /** 0–100. */
  progress: number
  updatedAt: string
}

export const IMPL_STATUSES: ImplStatus[] = ["Not Started", "In Progress", "On Track", "Delayed", "Completed"]

export function ragBand(progress: number): RagBand {
  if (progress >= 67) return "Green"
  if (progress >= 34) return "Amber"
  return "Red"
}

export interface StatusCount {
  status: ImplStatus
  count: number
}

export function statusDistribution(rows: ImplRow[]): StatusCount[] {
  return IMPL_STATUSES.map((status) => ({ status, count: rows.filter((r) => r.status === status).length }))
}

export interface RagCount {
  band: RagBand
  count: number
}

export function ragDistribution(rows: ImplRow[]): RagCount[] {
  const bands: RagBand[] = ["Green", "Amber", "Red"]
  return bands.map((band) => ({ band, count: rows.filter((r) => ragBand(r.progress) === band).length }))
}

function avg(nums: number[]): number {
  return nums.length === 0 ? 0 : Math.round(nums.reduce((a, b) => a + b, 0) / nums.length)
}

export interface GroupProgress {
  key: string
  avgProgress: number
  count: number
}

/** Average progress grouped by a string key, highest progress first. */
function groupAvg(rows: ImplRow[], keyOf: (r: ImplRow) => string): GroupProgress[] {
  const groups = new Map<string, number[]>()
  for (const r of rows) {
    const k = keyOf(r)
    const list = groups.get(k) ?? []
    list.push(r.progress)
    groups.set(k, list)
  }
  return [...groups.entries()]
    .map(([key, vals]) => ({ key, avgProgress: avg(vals), count: vals.length }))
    .sort((a, b) => b.avgProgress - a.avgProgress || a.key.localeCompare(b.key))
}

export function byThrustArea(rows: ImplRow[]): GroupProgress[] {
  return groupAvg(rows, (r) => r.thrustArea)
}

export function byRegionType(rows: ImplRow[]): GroupProgress[] {
  return groupAvg(rows, (r) => r.regionType)
}

/** Delayed items, or any item below the Amber threshold — the escalation shortlist. */
export function atRisk(rows: ImplRow[]): ImplRow[] {
  return rows
    .filter((r) => r.status === "Delayed" || ragBand(r.progress) === "Red")
    .sort((a, b) => a.progress - b.progress)
}

export interface AnalyticsSummary {
  total: number
  avgProgress: number
  /** Share of items that are On Track or Completed (0–100). */
  onTrackPct: number
  atRiskCount: number
  completed: number
}

export function analyticsSummary(rows: ImplRow[]): AnalyticsSummary {
  const completed = rows.filter((r) => r.status === "Completed").length
  const onTrack = rows.filter((r) => r.status === "On Track" || r.status === "Completed").length
  return {
    total: rows.length,
    avgProgress: avg(rows.map((r) => r.progress)),
    onTrackPct: rows.length === 0 ? 0 : Math.round((onTrack / rows.length) * 100),
    atRiskCount: atRisk(rows).length,
    completed,
  }
}

// Seed: a realistic NEP-2020 implementation picture across thrust areas and tiers.
export const NEP_IMPL_SEED: ImplRow[] = [
  { policyId: "NEP-FLN", policy: "NIPUN Bharat (FLN)", thrustArea: "Foundational Literacy & Numeracy", region: "Tamil Nadu", regionType: "State", status: "On Track", progress: 78, updatedAt: "2026-05-20" },
  { policyId: "NEP-FLN", policy: "NIPUN Bharat (FLN)", thrustArea: "Foundational Literacy & Numeracy", region: "Chennai", regionType: "District", status: "On Track", progress: 82, updatedAt: "2026-05-22" },
  { policyId: "NEP-FLN", policy: "NIPUN Bharat (FLN)", thrustArea: "Foundational Literacy & Numeracy", region: "Egmore", regionType: "Block", status: "In Progress", progress: 61, updatedAt: "2026-05-18" },
  { policyId: "NEP-ECCE", policy: "ECCE / Pre-primary integration", thrustArea: "Early Childhood Care & Education", region: "Tamil Nadu", regionType: "State", status: "In Progress", progress: 54, updatedAt: "2026-05-12" },
  { policyId: "NEP-ECCE", policy: "ECCE / Pre-primary integration", thrustArea: "Early Childhood Care & Education", region: "Madurai", regionType: "District", status: "Delayed", progress: 29, updatedAt: "2026-04-30" },
  { policyId: "NEP-HPC", policy: "Holistic Progress Card (PARAKH)", thrustArea: "Assessment Reform", region: "Tamil Nadu", regionType: "State", status: "In Progress", progress: 47, updatedAt: "2026-05-25" },
  { policyId: "NEP-HPC", policy: "Holistic Progress Card (PARAKH)", thrustArea: "Assessment Reform", region: "Coimbatore", regionType: "District", status: "In Progress", progress: 43, updatedAt: "2026-05-21" },
  { policyId: "NEP-VOC", policy: "Vocational education (NSQF)", thrustArea: "Vocational & Skills", region: "Tamil Nadu", regionType: "State", status: "On Track", progress: 69, updatedAt: "2026-05-19" },
  { policyId: "NEP-VOC", policy: "Vocational education (NSQF)", thrustArea: "Vocational & Skills", region: "Tiruchirappalli", regionType: "District", status: "Delayed", progress: 31, updatedAt: "2026-04-28" },
  { policyId: "NEP-CPD", policy: "Teacher CPD (50 hrs/yr)", thrustArea: "Teacher Capacity", region: "Tamil Nadu", regionType: "State", status: "Completed", progress: 100, updatedAt: "2026-05-26" },
  { policyId: "NEP-CPD", policy: "Teacher CPD (50 hrs/yr)", thrustArea: "Teacher Capacity", region: "Salem", regionType: "District", status: "On Track", progress: 88, updatedAt: "2026-05-24" },
  { policyId: "NEP-DIG", policy: "Digital content (DIKSHA/Tamil)", thrustArea: "Digital Learning", region: "Tamil Nadu", regionType: "State", status: "In Progress", progress: 58, updatedAt: "2026-05-23" },
  { policyId: "NEP-MT", policy: "Mother-tongue instruction", thrustArea: "Multilingualism", region: "Tamil Nadu", regionType: "State", status: "On Track", progress: 72, updatedAt: "2026-05-15" },
  { policyId: "NEP-EQ", policy: "Equity & inclusion (CWSN/SEDG)", thrustArea: "Equity & Inclusion", region: "Tamil Nadu", regionType: "State", status: "In Progress", progress: 49, updatedAt: "2026-05-17" },
  { policyId: "NEP-EQ", policy: "Equity & inclusion (CWSN/SEDG)", thrustArea: "Equity & Inclusion", region: "Tirunelveli", regionType: "District", status: "Not Started", progress: 8, updatedAt: "2026-04-10" },
]
