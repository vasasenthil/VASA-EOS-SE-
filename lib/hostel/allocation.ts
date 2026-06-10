// VASA-EOS(SE) — Adi Dravidar hostel allocation (Module Catalogue v3.0 — School/Welfare tier).
//
// Residential hostels (Adi Dravidar & Tribal Welfare, BC/MBC) let children from remote and disadvantaged homes
// stay in school. Seats are scarce, so allocation must be equitable, not first-come: this scores each applicant
// by social-category need and travel distance, then fills each hostel's vacancy highest-need-first and waitlists
// the rest. Matched by hostel type (Boys/Girls). Sample data seeded; real applications persist behind getDb().
// Pure + client-safe.

export type HostelType = "Boys" | "Girls"

export interface Hostel {
  id: string
  name: string
  district: string
  type: HostelType
  capacity: number
  occupied: number
}

export const HOSTELS: Hostel[] = [
  { id: "H-MDU-B1", name: "Adi Dravidar Boys Hostel, Madurai", district: "Madurai", type: "Boys", capacity: 100, occupied: 99 },
  { id: "H-MDU-G1", name: "Adi Dravidar Girls Hostel, Madurai", district: "Madurai", type: "Girls", capacity: 100, occupied: 99 },
  { id: "H-NIL-B1", name: "Tribal Welfare Boys Hostel, Nilgiris", district: "Nilgiris", type: "Boys", capacity: 60, occupied: 60 },
  { id: "H-TNV-G1", name: "BC/MBC Girls Hostel, Tirunelveli", district: "Tirunelveli", type: "Girls", capacity: 80, occupied: 80 },
]

export function vacancy(h: Hostel): number {
  return Math.max(0, h.capacity - h.occupied)
}

export function occupancyPct(h: Hostel): number {
  return h.capacity === 0 ? 0 : Math.round((h.occupied / h.capacity) * 100)
}

export interface HostelApplicant {
  studentId: string
  name: string
  type: HostelType
  category: string
  /** Home-to-school distance in km. */
  distanceKm: number
}

export const APPLICANTS: HostelApplicant[] = [
  { studentId: "S-7001", name: "Applicant A", type: "Boys", category: "ST", distanceKm: 28 },
  { studentId: "S-7002", name: "Applicant B", type: "Boys", category: "SC", distanceKm: 12 },
  { studentId: "S-7003", name: "Applicant C", type: "Boys", category: "OBC", distanceKm: 6 },
  { studentId: "S-7004", name: "Applicant D", type: "Boys", category: "General", distanceKm: 22 },
  { studentId: "S-7005", name: "Applicant E", type: "Girls", category: "ST", distanceKm: 18 },
  { studentId: "S-7006", name: "Applicant F", type: "Girls", category: "SC", distanceKm: 9 },
  { studentId: "S-7007", name: "Applicant G", type: "Girls", category: "OBC", distanceKm: 30 },
]

const CATEGORY_WEIGHT: Record<string, number> = { ST: 3, SC: 2, OBC: 1, EWS: 1, General: 0 }

/** Need-priority score: social-category weight + a distance band. Higher = more need. */
export function priorityScore(a: HostelApplicant): number {
  const cat = CATEGORY_WEIGHT[a.category] ?? 0
  const dist = a.distanceKm >= 20 ? 2 : a.distanceKm >= 10 ? 1 : 0
  return cat + dist
}

export interface Allocation {
  applicant: HostelApplicant
  score: number
  hostelId?: string
  outcome: "allotted" | "waitlisted"
}

/** Allocate applicants to vacancies within their hostel type, highest-need first. */
export function allocate(hostels: Hostel[] = HOSTELS, applicants: HostelApplicant[] = APPLICANTS): Allocation[] {
  const result: Allocation[] = []
  for (const type of ["Boys", "Girls"] as HostelType[]) {
    // remaining vacancy per hostel of this type
    const slots = hostels.filter((h) => h.type === type).map((h) => ({ id: h.id, free: vacancy(h) }))
    const ranked = applicants
      .filter((a) => a.type === type)
      .map((a) => ({ a, score: priorityScore(a) }))
      .sort((x, y) => y.score - x.score)
    for (const { a, score } of ranked) {
      const slot = slots.find((s) => s.free > 0)
      if (slot) {
        slot.free--
        result.push({ applicant: a, score, hostelId: slot.id, outcome: "allotted" })
      } else {
        result.push({ applicant: a, score, outcome: "waitlisted" })
      }
    }
  }
  return result
}

export interface HostelSummary {
  hostels: number
  totalCapacity: number
  totalOccupied: number
  totalVacancy: number
  avgOccupancyPct: number
  applicants: number
  allotted: number
  waitlisted: number
}

export function hostelSummary(hostels: Hostel[] = HOSTELS, applicants: HostelApplicant[] = APPLICANTS): HostelSummary {
  const alloc = allocate(hostels, applicants)
  const cap = hostels.reduce((s, h) => s + h.capacity, 0)
  const occ = hostels.reduce((s, h) => s + h.occupied, 0)
  return {
    hostels: hostels.length,
    totalCapacity: cap,
    totalOccupied: occ,
    totalVacancy: hostels.reduce((s, h) => s + vacancy(h), 0),
    avgOccupancyPct: cap === 0 ? 0 : Math.round((occ / cap) * 100),
    applicants: applicants.length,
    allotted: alloc.filter((r) => r.outcome === "allotted").length,
    waitlisted: alloc.filter((r) => r.outcome === "waitlisted").length,
  }
}

function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(hostels: Hostel[] = HOSTELS, applicants: HostelApplicant[] = APPLICANTS): string {
  const header = ["Student", "Type", "Category", "Distance km", "Score", "Outcome", "Hostel"]
  const rows = allocate(hostels, applicants).map((r) =>
    [r.applicant.studentId, r.applicant.type, r.applicant.category, String(r.applicant.distanceKm), String(r.score), r.outcome, r.hostelId ?? "—"].map(csvField).join(","),
  )
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
