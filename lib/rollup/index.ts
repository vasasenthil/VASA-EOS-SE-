// VASA-EOS(SE) — Multi-tier Governance Roll-up: school KPIs aggregated UP the hierarchy.
//
// The diagram's promise — kill "decision lag · data opacity · no single source of truth" — needs
// school-tier data to flow UP: School → Block → District → State. This module holds durable per-
// school KPI snapshots and a pure, enrolment-weighted aggregator that rolls them up to any level so
// a Secretary/DEO/BEO sees one honest, drill-downable picture. Pure + client-safe; the dashboard
// drills State → District → Block → School.

export interface SchoolKpi {
  id: string
  schoolName: string
  udise: string
  district: string
  block: string
  enrolment: number
  attendancePct: number
  passPct: number
  feeCollectionPct: number
  atRiskCount: number
  complianceGaps: number
  academicYear: string
  createdAt: string
  updatedAt: string
}

export interface KpiInput {
  schoolName: string
  udise: string
  district: string
  block: string
  enrolment: number
  attendancePct: number
  passPct: number
  feeCollectionPct: number
  atRiskCount: number
  complianceGaps: number
  academicYear: string
}

export function emptyKpi(): KpiInput {
  return { schoolName: "", udise: "", district: "", block: "", enrolment: 0, attendancePct: 0, passPct: 0, feeCollectionPct: 0, atRiskCount: 0, complianceGaps: 0, academicYear: "2026-2027" }
}

export interface AggregateKpi {
  label: string
  schools: number
  enrolment: number
  attendancePct: number // enrolment-weighted
  passPct: number
  feeCollectionPct: number
  atRiskCount: number
  complianceGaps: number
}

function round1(x: number): number {
  return Math.round(x * 10) / 10
}

/** Enrolment-weighted aggregate over a set of school snapshots. */
export function aggregate(label: string, snapshots: SchoolKpi[]): AggregateKpi {
  const enrolment = snapshots.reduce((s, k) => s + Math.max(0, k.enrolment), 0)
  const w = (sel: (k: SchoolKpi) => number) =>
    enrolment > 0 ? round1(snapshots.reduce((s, k) => s + sel(k) * Math.max(0, k.enrolment), 0) / enrolment) : 0
  return {
    label,
    schools: snapshots.length,
    enrolment,
    attendancePct: w((k) => k.attendancePct),
    passPct: w((k) => k.passPct),
    feeCollectionPct: w((k) => k.feeCollectionPct),
    atRiskCount: snapshots.reduce((s, k) => s + Math.max(0, k.atRiskCount), 0),
    complianceGaps: snapshots.reduce((s, k) => s + Math.max(0, k.complianceGaps), 0),
  }
}

/** Group by a tier key and aggregate each group; sorted by enrolment (largest first). */
export function groupBy(snapshots: SchoolKpi[], key: "district" | "block"): AggregateKpi[] {
  const groups = new Map<string, SchoolKpi[]>()
  for (const k of snapshots) {
    const g = k[key] || "—"
    if (!groups.has(g)) groups.set(g, [])
    groups.get(g)!.push(k)
  }
  return [...groups.entries()].map(([label, rows]) => aggregate(label, rows)).sort((a, b) => b.enrolment - a.enrolment)
}

/** Units that need attention (any KPI below the action threshold), worst first. */
export function flagged(units: AggregateKpi[]): AggregateKpi[] {
  return units.filter((u) => u.attendancePct < 75 || u.passPct < 60 || u.feeCollectionPct < 70 || u.complianceGaps > 0)
    .sort((a, b) => a.attendancePct - b.attendancePct)
}

export type KpiErrors = Partial<Record<keyof KpiInput, string>>

const UDISE_RE = /^\d{11}$/
const AY_RE = /^\d{4}-\d{4}$/

export function validateKpi(f: KpiInput): { ok: boolean; errors: KpiErrors } {
  const e: KpiErrors = {}
  if (!f.schoolName.trim()) e.schoolName = "School name is required"
  if (!UDISE_RE.test(f.udise.trim())) e.udise = "UDISE code must be 11 digits"
  if (!f.district.trim()) e.district = "District is required"
  if (!f.block.trim()) e.block = "Block is required"
  if (!Number.isFinite(f.enrolment) || f.enrolment <= 0) e.enrolment = "Enrolment must be greater than 0"
  for (const [k, label] of [["attendancePct", "Attendance"], ["passPct", "Pass"], ["feeCollectionPct", "Fee collection"]] as const) {
    const v = f[k]
    if (!Number.isFinite(v) || v < 0 || v > 100) e[k] = `${label} % must be 0–100`
  }
  if (!Number.isInteger(f.atRiskCount) || f.atRiskCount < 0) e.atRiskCount = "Cannot be negative"
  if (!Number.isInteger(f.complianceGaps) || f.complianceGaps < 0) e.complianceGaps = "Cannot be negative"
  if (!AY_RE.test(f.academicYear.trim())) e.academicYear = "Use an academic year like 2026-2027"
  else { const [a, b] = f.academicYear.split("-").map(Number); if (b !== a + 1) e.academicYear = "Academic year must be consecutive" }
  return { ok: Object.keys(e).length === 0, errors: e }
}

export function districtsOf(snapshots: SchoolKpi[]): string[] {
  return [...new Set(snapshots.map((k) => k.district).filter(Boolean))].sort()
}
