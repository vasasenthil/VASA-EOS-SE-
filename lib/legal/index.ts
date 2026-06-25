// VASA-EOS(SE) — Legal Case Management (Module Catalogue v3.0 — State tier).
//
// The department is a constant litigant: service matters, RTE/admission writs, recognition appeals, PILs and
// property disputes. Missing a hearing or a counter-filing deadline has real cost. This tracks each case with
// its court, type, status and next hearing, computes which hearings are imminent (time-pure), and weights a
// risk register so attention follows exposure. Sample dataset seeded; the persisted register would live behind
// the getDb() seam. Pure + client-safe.

import { csvField } from "@/lib/csv"

export type CaseStatus = "filed" | "hearing" | "reserved" | "disposed"
export type CaseRisk = "low" | "medium" | "high"

export const CASE_TYPES = [
  "Service matter",
  "RTE / admission writ",
  "Recognition appeal",
  "PIL",
  "Property / lease",
  "Contract dispute",
] as const

export const COURTS = [
  "Madras High Court",
  "Madurai Bench (MHC)",
  "TN Administrative Tribunal",
  "District Court",
  "Supreme Court of India",
] as const

export interface LegalCase {
  id: string
  title: string
  court: string
  caseType: string
  status: CaseStatus
  /** ISO date of the next listed hearing (omitted once disposed). */
  nextHearing?: string
  risk: CaseRisk
  /** Counsel / department owning the matter. */
  owner: string
}

export const LEGAL_CASES: LegalCase[] = [
  { id: "WP-2026-1180", title: "Aided-school teacher promotion seniority", court: "Madras High Court", caseType: "Service matter", status: "hearing", nextHearing: "2026-06-12", risk: "medium", owner: "Govt Pleader (Education)" },
  { id: "WP-2026-1331", title: "EWS 25% admission denial — private school", court: "Madras High Court", caseType: "RTE / admission writ", status: "filed", nextHearing: "2026-06-15", risk: "high", owner: "Govt Pleader (Education)" },
  { id: "OA-2026-0442", title: "Headmaster transfer challenge", court: "TN Administrative Tribunal", caseType: "Service matter", status: "hearing", nextHearing: "2026-06-11", risk: "low", owner: "Standing Counsel" },
  { id: "WA-2026-0207", title: "Recognition withdrawal appeal (TN 1973)", court: "Madurai Bench (MHC)", caseType: "Recognition appeal", status: "reserved", nextHearing: "2026-06-20", risk: "medium", owner: "Govt Pleader (Education)" },
  { id: "WP-2026-1402", title: "Mid-day-meal kitchen safety PIL", court: "Madras High Court", caseType: "PIL", status: "hearing", nextHearing: "2026-06-13", risk: "high", owner: "Advocate General office" },
  { id: "OS-2025-0918", title: "School land lease dispute — Coimbatore", court: "District Court", caseType: "Property / lease", status: "filed", nextHearing: "2026-07-01", risk: "low", owner: "District Legal Cell" },
  { id: "WP-2025-0771", title: "Textbook procurement contract dispute", court: "Madras High Court", caseType: "Contract dispute", status: "disposed", risk: "low", owner: "Govt Pleader (Education)" },
]

export function caseById(id: string): LegalCase | undefined {
  return LEGAL_CASES.find((c) => c.id === id)
}

export function byStatus(status: CaseStatus): LegalCase[] {
  return LEGAL_CASES.filter((c) => c.status === status)
}

/** Active (undisposed) cases with a hearing within `days`, soonest first. */
export function upcomingHearings(now: Date = new Date(), days = 7, items: LegalCase[] = LEGAL_CASES): LegalCase[] {
  const horizon = now.getTime() + days * 86_400_000
  return items
    .filter((c) => c.status !== "disposed" && c.nextHearing)
    .filter((c) => {
      const t = new Date(c.nextHearing as string).getTime()
      return t >= now.getTime() && t <= horizon
    })
    .sort((a, b) => new Date(a.nextHearing as string).getTime() - new Date(b.nextHearing as string).getTime())
}

export interface LegalSummary {
  total: number
  active: number
  disposed: number
  highRisk: number
  /** Active cases with a hearing in the next 7 days. */
  imminentHearings: number
  byType: { type: string; count: number }[]
}

export function legalSummary(now: Date = new Date(), items: LegalCase[] = LEGAL_CASES): LegalSummary {
  const active = items.filter((c) => c.status !== "disposed")
  const counts = new Map<string, number>()
  for (const c of items) counts.set(c.caseType, (counts.get(c.caseType) ?? 0) + 1)
  return {
    total: items.length,
    active: active.length,
    disposed: items.filter((c) => c.status === "disposed").length,
    highRisk: active.filter((c) => c.risk === "high").length,
    imminentHearings: upcomingHearings(now, 7, items).length,
    byType: [...counts.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
  }
}

export function toCSV(items: LegalCase[] = LEGAL_CASES): string {
  const header = ["Case ID", "Title", "Court", "Type", "Status", "Next hearing", "Risk", "Owner"]
  const rows = items.map((c) => [c.id, c.title, c.court, c.caseType, c.status, c.nextHearing ?? "—", c.risk, c.owner].map(csvField).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
