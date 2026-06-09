// VASA-EOS(SE) — portal data aggregation (client-safe, pure).
// Derives the stakeholder-portal KPIs from the platform's shared datasets — the
// SIS roster, infrastructure register, quality/inspection index and disaster
// readiness — instead of hard-coded placeholders. Live operational counts that
// require the server stores (grievances, recognition) are awaited in the portal
// pages and merged in.

import { SIS_ROSTER, summarise, type SisStudent } from "@/lib/sis"
import { INFRASTRUCTURE, infraSummary } from "@/lib/infrastructure"
import { QUALITY, qualitySummary, type Compliance } from "@/lib/quality"
import { INCIDENTS, SCHOOL_SAFETY, emergencySummary } from "@/lib/emergency"

export function rosterForDistrict(district: string): SisStudent[] {
  return SIS_ROSTER.filter((s) => s.district === district)
}

export function rosterForSchools(udises: string[]): SisStudent[] {
  return SIS_ROSTER.filter((s) => s.currentSchoolUdise !== undefined && udises.includes(s.currentSchoolUdise))
}

export function districts(): string[] {
  return Array.from(new Set(SIS_ROSTER.map((s) => s.district).filter((d): d is string => Boolean(d))))
}

/** Distinct schools known across the quality, infrastructure and roster datasets. */
export function knownSchools(): string[] {
  const udises = new Set<string>()
  QUALITY.forEach((q) => udises.add(q.udise))
  INFRASTRUCTURE.forEach((i) => udises.add(i.udise))
  SIS_ROSTER.forEach((s) => {
    if (s.currentSchoolUdise) udises.add(s.currentSchoolUdise)
  })
  return Array.from(udises)
}

export function nipunOnTrackPct(roster: SisStudent[] = SIS_ROSTER): number {
  if (roster.length === 0) return 0
  return Math.round((roster.filter((s) => s.nipunStatus === "on-track").length / roster.length) * 100)
}

/** Share of learners enrolled in at least one welfare scheme. */
export function schemeCoveragePct(roster: SisStudent[] = SIS_ROSTER): number {
  if (roster.length === 0) return 0
  return Math.round((roster.filter((s) => s.schemes.length > 0).length / roster.length) * 100)
}

/** Number of learners benefiting from a named scheme (substring match). */
export function schemeBeneficiaries(name: string, roster: SisStudent[] = SIS_ROSTER): number {
  return roster.filter((s) => s.schemes.some((x) => x.toLowerCase().includes(name.toLowerCase()))).length
}

export function distinctSchemes(roster: SisStudent[] = SIS_ROSTER): number {
  return new Set(roster.flatMap((s) => s.schemes)).size
}

/** Worst compliance band across the quality index — the headline risk colour. */
export function headlineCompliance(): Compliance {
  if (QUALITY.some((q) => q.compliance === "red")) return "red"
  if (QUALITY.some((q) => q.compliance === "amber")) return "amber"
  return "green"
}

export interface StateRollup {
  students: number
  girls: number
  cwsn: number
  atRisk: number
  avgAttendance: number
  nipunOnTrackPct: number
  schemeCoveragePct: number
  distinctSchemes: number
  districts: number
  schools: number
  avgQualityIndex: number
  inspectionsDue: number
  compliance: Compliance
  infraReadiness: number
  mandatedGaps: number
  activeIncidents: number
  drillCompliant: number
  schoolsTotal: number
}

/** One aggregate over every shared dataset; portals select the tiles they surface. */
export function stateRollup(): StateRollup {
  const sis = summarise()
  const q = qualitySummary()
  const infra = infraSummary()
  const emg = emergencySummary(INCIDENTS, SCHOOL_SAFETY)
  return {
    students: sis.total,
    girls: sis.girls,
    cwsn: sis.cwsn,
    atRisk: sis.atRisk,
    avgAttendance: sis.avgAttendance,
    nipunOnTrackPct: nipunOnTrackPct(),
    schemeCoveragePct: schemeCoveragePct(),
    distinctSchemes: distinctSchemes(),
    districts: districts().length,
    schools: knownSchools().length,
    avgQualityIndex: q.avgIndex,
    inspectionsDue: q.highPriority,
    compliance: headlineCompliance(),
    infraReadiness: infra.avgReadiness,
    mandatedGaps: infra.mandatedGaps,
    activeIncidents: emg.activeIncidents,
    drillCompliant: emg.drillCompliant,
    schoolsTotal: SCHOOL_SAFETY.length,
  }
}

const COMPLIANCE_LABEL: Record<Compliance, string> = { green: "Green", amber: "Amber", red: "Red" }
export function complianceLabel(c: Compliance): string {
  return COMPLIANCE_LABEL[c]
}
