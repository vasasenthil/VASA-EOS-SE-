// VASA-EOS(SE) — directorate resource allocation across districts (the Director's equity lever).
//
// A directorate doesn't just hold a budget — it must split it across districts, and "equal" is not "equitable":
// a remote tribal district needs more per child than a well-resourced city. This distributes the directorate
// envelope (grounded in the real finance budget) by a NEED-WEIGHTED formula — enrolment × (1 + needIndex) — so
// higher-need districts draw a larger per-student share, and surfaces the progressivity ratio so the politics of
// equity are visible. Pure (the pool is a parameter defaulting to the real budget total) + client-safe.

import { financeSummary } from "@/lib/finance"

export interface DistrictProfile {
  district: string
  schools: number
  enrolment: number
  /** Relative need (0–100): remoteness, deprivation, infrastructure gaps. Higher = more need. */
  needIndex: number
}

export const DISTRICT_PROFILES: DistrictProfile[] = [
  { district: "Chennai", schools: 60, enrolment: 9000, needIndex: 20 },
  { district: "Coimbatore", schools: 50, enrolment: 7000, needIndex: 30 },
  { district: "Madurai", schools: 45, enrolment: 6500, needIndex: 45 },
  { district: "Salem", schools: 40, enrolment: 5000, needIndex: 50 },
  { district: "Tiruchirappalli", schools: 38, enrolment: 4800, needIndex: 40 },
  { district: "Tirunelveli", schools: 35, enrolment: 4200, needIndex: 55 },
  { district: "Dindigul", schools: 30, enrolment: 3000, needIndex: 65 },
  { district: "Nilgiris", schools: 18, enrolment: 1200, needIndex: 80 },
]

/** Need-weighted demand for a district: enrolment scaled by its need index. */
export function weightOf(d: DistrictProfile): number {
  return d.enrolment * (1 + d.needIndex / 100)
}

export interface DistrictAllocation extends DistrictProfile {
  weight: number
  /** Share of the envelope, 0–100. */
  sharePct: number
  allocated: number
  /** Allocation per enrolled student. */
  perStudent: number
}

/** Distribute the envelope across districts by need-weighted share (largest allocation first). */
export function allocate(pool: number = financeSummary().allocated, items: DistrictProfile[] = DISTRICT_PROFILES): DistrictAllocation[] {
  const totalWeight = items.reduce((s, d) => s + weightOf(d), 0)
  return items
    .map((d) => {
      const weight = weightOf(d)
      const share = totalWeight === 0 ? 0 : weight / totalWeight
      const allocated = Math.round(pool * share)
      return {
        ...d,
        weight,
        sharePct: Math.round(share * 100),
        allocated,
        perStudent: d.enrolment === 0 ? 0 : Math.round(allocated / d.enrolment),
      }
    })
    .sort((a, b) => b.allocated - a.allocated)
}

export interface AllocationSummary {
  districts: number
  pool: number
  totalEnrolment: number
  totalSchools: number
  /** Per-student funding ratio of highest-need to lowest-need district (>1 ⇒ progressive). */
  progressivityRatio: number
  topDistrict: string
}

export function allocationSummary(pool: number = financeSummary().allocated, items: DistrictProfile[] = DISTRICT_PROFILES): AllocationSummary {
  const rows = allocate(pool, items)
  const perStudents = rows.map((r) => r.perStudent).filter((p) => p > 0)
  const max = Math.max(...perStudents)
  const min = Math.min(...perStudents)
  return {
    districts: rows.length,
    pool,
    totalEnrolment: items.reduce((s, d) => s + d.enrolment, 0),
    totalSchools: items.reduce((s, d) => s + d.schools, 0),
    progressivityRatio: min === 0 ? 0 : Math.round((max / min) * 100) / 100,
    topDistrict: rows[0]?.district ?? "",
  }
}

function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(pool: number = financeSummary().allocated, items: DistrictProfile[] = DISTRICT_PROFILES): string {
  const header = ["District", "Schools", "Enrolment", "Need index", "Share %", "Allocated", "Per student"]
  const rows = allocate(pool, items).map((r) =>
    [r.district, String(r.schools), String(r.enrolment), String(r.needIndex), String(r.sharePct), String(r.allocated), String(r.perStudent)].map(csvField).join(","),
  )
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
