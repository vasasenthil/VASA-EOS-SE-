// VASA-EOS(SE) — teacher continuous professional development (Sec 16 / NEP 50-hours).
// Track CPD activities and progress toward the NEP-recommended annual hours.

export type CpdMode = "online" | "offline" | "blended"

export interface CpdRecord {
  id: string
  title: string
  provider: string
  hours: number
  date: string
  mode: CpdMode
}

export const ANNUAL_CPD_HOURS = 50 // NEP 2020 recommends 50 CPD hours per teacher per year.

export const SAMPLE_CPD: CpdRecord[] = [
  { id: "cpd-seed1", title: "NISHTHA — Foundational Literacy & Numeracy", provider: "DIKSHA / NCERT", hours: 18, date: "2026-04-12", mode: "online" },
  { id: "cpd-seed2", title: "Tamil-first pedagogy workshop", provider: "SCERT / DIET", hours: 8, date: "2026-05-03", mode: "offline" },
]

export function newCpdId(): string {
  return `cpd-${Math.random().toString(36).slice(2, 8)}`
}

export interface CpdSummary {
  records: number
  totalHours: number
  required: number
  met: boolean
  pct: number // capped at 100
}

export function cpdSummary(records: CpdRecord[] = SAMPLE_CPD): CpdSummary {
  const totalHours = records.reduce((s, r) => s + (Number.isFinite(r.hours) ? r.hours : 0), 0)
  return {
    records: records.length,
    totalHours,
    required: ANNUAL_CPD_HOURS,
    met: totalHours >= ANNUAL_CPD_HOURS,
    pct: Math.min(100, Math.round((totalHours / ANNUAL_CPD_HOURS) * 100)),
  }
}
