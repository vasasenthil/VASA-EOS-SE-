import { csvField } from "@/lib/csv"
import { DIRECTORATES, directorateById, type Directorate } from "@/lib/governance/directorates"
import { agingProfile, rollupByFlow, summarizeOversight, type OversightItem } from "@/lib/governance/oversight"
import type { StateRollup } from "@/lib/portal-data"

export interface DirectorateIntervention {
  id: string
  severity: "critical" | "high" | "watch"
  title: string
  detail: string
  href: string
}

export interface DirectorateOperationsReport {
  generatedAt: string
  directorate: Directorate
  portfolio: Directorate[]
  state: StateRollup
  workflows: ReturnType<typeof summarizeOversight>
  workflowFlows: ReturnType<typeof rollupByFlow>
  directorDecisions: OversightItem[]
  aging: ReturnType<typeof agingProfile>
  interventions: DirectorateIntervention[]
  evidence: { source: string; mode: "live-store" | "reference-register"; scope: string }[]
}

export function resolveDirectorate(id?: string | null): Directorate {
  return (id && directorateById(id)) || DIRECTORATES[0]
}

/**
 * Builds an honest directorate lens over shared state evidence. Numeric evidence is
 * never partitioned synthetically: until source systems carry a directorate key it
 * remains explicitly state-scoped, while decision queues are read from live stores.
 */
export function buildDirectorateOperationsReport(
  state: StateRollup,
  oversight: OversightItem[],
  directorateId?: string | null,
  generatedAt = new Date().toISOString(),
): DirectorateOperationsReport {
  const directorate = resolveDirectorate(directorateId)
  const directorDecisions = oversight.filter((item) => item.status === "in_progress" && item.currentRole === "DIRECTOR")
  const aging = agingProfile(directorDecisions, Date.parse(generatedAt))
  const overdue = aging.find((row) => row.bucket === ">7 days")?.count ?? 0
  const interventions: DirectorateIntervention[] = []

  if (state.activeIncidents > 0) interventions.push({ id: "safety", severity: "critical", title: "Safety incident command", detail: `${state.activeIncidents} active incident(s) require directorate coordination.`, href: "/safety-incidents" })
  if (overdue > 0) interventions.push({ id: "sla", severity: "high", title: "Director decision SLA breach", detail: `${overdue} director-level decision(s) have been idle for more than seven days.`, href: "/approvals" })
  if (directorDecisions.length > 0) interventions.push({ id: "decisions", severity: "high", title: "Director approval queue", detail: `${directorDecisions.length} live workflow item(s) await Director authority.`, href: "/approvals" })
  if (state.inspectionsDue > 0) interventions.push({ id: "quality", severity: "watch", title: "Inspection programme", detail: `${state.inspectionsDue} inspections are prioritised in the current state evidence scope.`, href: "/quality" })
  if (state.mandatedGaps > 0) interventions.push({ id: "infrastructure", severity: "watch", title: "Mandated infrastructure gaps", detail: `${state.mandatedGaps} registered gaps require closure planning.`, href: "/infrastructure" })
  if (directorate.status === "partial") interventions.push({ id: "coverage", severity: "watch", title: "Module coverage limitation", detail: `${directorate.abbr} specialised operations are marked partial in the governance register.`, href: "/governance/directorates" })

  return {
    generatedAt,
    directorate,
    portfolio: DIRECTORATES,
    state,
    workflows: summarizeOversight(oversight),
    workflowFlows: rollupByFlow(oversight),
    directorDecisions,
    aging,
    interventions,
    evidence: [
      { source: "Cross-process workflow stores", mode: "live-store", scope: "Director decision queue" },
      { source: "SIS, quality, infrastructure and safety registers", mode: "reference-register", scope: "State-wide context; not synthetically apportioned" },
      { source: "Seven-directorate governance register", mode: "reference-register", scope: directorate.abbr },
    ],
  }
}

export function directorateOperationsReportToCsv(report: DirectorateOperationsReport): string {
  const rows: Array<Array<string | number>> = [
    ["metadata", "generated_at", report.generatedAt],
    ["metadata", "directorate", report.directorate.name],
    ["state_context", "students", report.state.students],
    ["state_context", "schools", report.state.schools],
    ["state_context", "districts", report.state.districts],
    ["state_context", "average_attendance", report.state.avgAttendance],
    ["state_context", "quality_index", report.state.avgQualityIndex],
    ["state_context", "infrastructure_readiness_pct", report.state.infraReadiness],
    ["workflow", "director_decisions", report.directorDecisions.length],
    ["workflow", "all_in_progress", report.workflows.inProgress],
    ...report.interventions.map((item) => ["intervention", item.severity, `${item.title}: ${item.detail}`]),
  ]
  return ["section,metric,value", ...rows.map((row) => row.map((value) => csvField(String(value))).join(","))].join("\r\n") + "\r\n"
}
