import { csvField } from "@/lib/csv"
import { SCOPE_RECORDS, SCOPE_TENANTS, scopeRecords } from "@/lib/access/scope"
import { agingProfile, rollupByFlow, summarizeOversight, type OversightItem } from "@/lib/governance/oversight"
import { QUALITY, type Compliance } from "@/lib/quality"

export interface DistrictSchoolSignal {
  schoolId: string
  tenantId: string
  blockId: string
  name: string
  enrolment: number
  attendancePct: number
  qualityIndex: number | null
  compliance: Compliance | "unknown"
  riskScore: number
  heat: "critical" | "high" | "watch" | "stable"
  prioritySharePct: number
}

export interface DistrictIntervention {
  id: string
  severity: "critical" | "high" | "watch"
  title: string
  detail: string
  href: string
}

export interface DistrictOperationsReport {
  generatedAt: string
  districtId: string
  districtName: string
  schools: DistrictSchoolSignal[]
  totals: { schools: number; blocks: number; enrolment: number; attendancePct: number; highRiskSchools: number; evidenceCoveragePct: number }
  workflows: ReturnType<typeof summarizeOversight>
  workflowFlows: ReturnType<typeof rollupByFlow>
  deoDecisions: OversightItem[]
  aging: ReturnType<typeof agingProfile>
  interventions: DistrictIntervention[]
  evidence: { source: string; mode: "live-store" | "reference-register" | "derived-advisory"; scope: string }[]
}

const heatFor = (score: number): DistrictSchoolSignal["heat"] => score >= 70 ? "critical" : score >= 45 ? "high" : score >= 20 ? "watch" : "stable"

export function buildDistrictOperationsReport(districtId: string, oversight: OversightItem[], generatedAt = new Date().toISOString()): DistrictOperationsReport {
  const district = SCOPE_TENANTS.find((node) => node.id === districtId && node.tier === "district")
  if (!district) throw new Error("Invalid district jurisdiction")
  const visible = scopeRecords(SCOPE_TENANTS, districtId, SCOPE_RECORDS)
  const raw = visible.map((school) => {
    const quality = QUALITY.find((row) => row.name === school.name)
    const attendanceRisk = Math.max(0, 90 - school.attendancePct) * 4
    const qualityRisk = quality ? Math.max(0, 75 - quality.qualityIndex) * 2 : 0
    const riskScore = Math.min(100, Math.round(attendanceRisk + qualityRisk))
    const schoolNode = SCOPE_TENANTS.find((node) => node.id === school.tenantId)
    return { schoolId: school.id, tenantId: school.tenantId, blockId: schoolNode?.parentId ?? "unassigned", name: school.name, enrolment: school.enrolment, attendancePct: school.attendancePct, qualityIndex: quality?.qualityIndex ?? null, compliance: quality?.compliance ?? "unknown" as const, riskScore }
  })
  const totalPriority = raw.reduce((sum, row) => sum + row.enrolment * (1 + row.riskScore / 100), 0)
  const schools: DistrictSchoolSignal[] = raw.map((row) => ({ ...row, heat: heatFor(row.riskScore), prioritySharePct: totalPriority ? Math.round(row.enrolment * (1 + row.riskScore / 100) / totalPriority * 1000) / 10 : 0 })).sort((a, b) => b.riskScore - a.riskScore)
  const deoDecisions = oversight.filter((item) => item.status === "in_progress" && item.currentRole === "DEO")
  const aging = agingProfile(deoDecisions, Date.parse(generatedAt))
  const overdue = aging.find((row) => row.bucket === ">7 days")?.count ?? 0
  const interventions: DistrictIntervention[] = []
  if (overdue) interventions.push({ id: "sla", severity: "critical", title: "DEO decision SLA breach", detail: `${overdue} decision(s) have been idle for more than seven days.`, href: "/approvals" })
  if (deoDecisions.length) interventions.push({ id: "decisions", severity: "high", title: "District decision queue", detail: `${deoDecisions.length} workflow item(s) await DEO authority.`, href: "/approvals" })
  const highRisk = schools.filter((school) => school.heat === "critical" || school.heat === "high")
  if (highRisk.length) interventions.push({ id: "schools", severity: "high", title: "School support heat-map", detail: `${highRisk.length} school(s) require district review.`, href: "/quality" })
  const unknown = schools.filter((school) => school.qualityIndex === null).length
  if (unknown) interventions.push({ id: "coverage", severity: "watch", title: "Evidence coverage gap", detail: `${unknown} school(s) lack a linked quality record; no score was fabricated.`, href: "/quality" })
  const enrolment = schools.reduce((sum, row) => sum + row.enrolment, 0)
  return {
    generatedAt, districtId, districtName: district.name, schools,
    totals: { schools: schools.length, blocks: new Set(schools.map((row) => row.blockId)).size, enrolment, attendancePct: enrolment ? Math.round(schools.reduce((sum, row) => sum + row.attendancePct * row.enrolment, 0) / enrolment) : 0, highRiskSchools: highRisk.length, evidenceCoveragePct: schools.length ? Math.round((schools.length - unknown) / schools.length * 100) : 0 },
    workflows: summarizeOversight(oversight), workflowFlows: rollupByFlow(oversight), deoDecisions, aging, interventions,
    evidence: [
      { source: "Cross-process workflow stores", mode: "live-store", scope: "Authorized DEO decision view; workflow district tagging pending" },
      { source: "District tenancy, school and quality registers", mode: "reference-register", scope: districtId },
      { source: "Need/risk weighted priority-share model", mode: "derived-advisory", scope: `${districtId}; human sanction required` },
    ],
  }
}

export function districtOperationsReportToCsv(report: DistrictOperationsReport): string {
  const header = ["School ID", "School", "Block", "Enrolment", "Attendance %", "Quality index", "Compliance", "Risk score", "Heat", "Priority share %"]
  const rows = report.schools.map((row) => [row.schoolId, row.name, row.blockId, row.enrolment, row.attendancePct, row.qualityIndex ?? "", row.compliance, row.riskScore, row.heat, row.prioritySharePct].map((value) => csvField(String(value))).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
