// VASA-EOS(SE) — board-exam centre readiness (Module Catalogue v3.0 — School/DGE tier).
//
// Distinct from the exam-integrity register (which maps malpractice vectors to controls), this is the logistics
// layer: are the SSLC/HSC examination centres actually ready? Each centre carries its candidate allocation
// against capacity and a readiness checklist — CCTV, invigilators, seating plan, strong room, connectivity —
// and a centre is cleared to conduct only when every check is met and it is not over-allotted. Sample centres
// seeded. Pure + client-safe.

import { csvField } from "@/lib/csv"

export const READINESS_CHECKS = [
  "CCTV coverage",
  "Invigilators assigned",
  "Seating plan",
  "Strong room",
  "Connectivity",
] as const

export interface ExamCentre {
  id: string
  name: string
  district: string
  capacity: number
  allotted: number
  /** One boolean per READINESS_CHECKS entry. */
  checks: boolean[]
}

export const EXAM_CENTRES: ExamCentre[] = [
  { id: "EC-CHN-12", name: "GHSS Egmore", district: "Chennai", capacity: 480, allotted: 460, checks: [true, true, true, true, true] },
  { id: "EC-MDU-07", name: "GHSS Madurai East", district: "Madurai", capacity: 360, allotted: 360, checks: [true, true, true, true, false] },
  { id: "EC-CBE-03", name: "Govt Model HSS Coimbatore", district: "Coimbatore", capacity: 300, allotted: 318, checks: [true, true, false, true, true] },
  { id: "EC-TNV-05", name: "GHSS Tirunelveli", district: "Tirunelveli", capacity: 420, allotted: 390, checks: [true, true, true, true, true] },
  { id: "EC-SLM-09", name: "GHSS Salem West", district: "Salem", capacity: 280, allotted: 250, checks: [true, false, true, false, true] },
]

export function centreById(id: string): ExamCentre | undefined {
  return EXAM_CENTRES.find((c) => c.id === id)
}

export function utilisationPct(c: ExamCentre): number {
  return c.capacity === 0 ? 0 : Math.round((c.allotted / c.capacity) * 100)
}

export function overAllotted(c: ExamCentre): boolean {
  return c.allotted > c.capacity
}

export function readinessPct(c: ExamCentre): number {
  const met = c.checks.filter(Boolean).length
  return c.checks.length === 0 ? 0 : Math.round((met / c.checks.length) * 100)
}

/** A centre is cleared only when every check is met and it is not over-allotted. */
export function clearedToConduct(c: ExamCentre): boolean {
  return c.checks.every(Boolean) && !overAllotted(c)
}

/** The checks a centre is still missing. */
export function pendingChecks(c: ExamCentre): string[] {
  return READINESS_CHECKS.filter((_, i) => !c.checks[i])
}

export interface BoardPrepSummary {
  centres: number
  totalCapacity: number
  totalAllotted: number
  cleared: number
  overAllotted: number
  avgReadinessPct: number
}

export function boardPrepSummary(items: ExamCentre[] = EXAM_CENTRES): BoardPrepSummary {
  return {
    centres: items.length,
    totalCapacity: items.reduce((s, c) => s + c.capacity, 0),
    totalAllotted: items.reduce((s, c) => s + c.allotted, 0),
    cleared: items.filter((c) => clearedToConduct(c)).length,
    overAllotted: items.filter((c) => overAllotted(c)).length,
    avgReadinessPct: items.length === 0 ? 0 : Math.round(items.reduce((s, c) => s + readinessPct(c), 0) / items.length),
  }
}


export function toCSV(items: ExamCentre[] = EXAM_CENTRES): string {
  const header = ["Centre ID", "Name", "District", "Capacity", "Allotted", "Readiness %", "Cleared"]
  const rows = items.map((c) => [c.id, c.name, c.district, String(c.capacity), String(c.allotted), String(readinessPct(c)), clearedToConduct(c) ? "yes" : "no"].map(csvField).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
