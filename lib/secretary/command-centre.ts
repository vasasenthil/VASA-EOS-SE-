import { csvField } from "@/lib/csv"
import { agingProfile, pendingByRole, rollupByFlow, summarizeOversight, type OversightItem } from "@/lib/governance/oversight"
import type { StateRollup } from "@/lib/portal-data"

export interface SecretaryPriority {
  id: string
  severity: "critical" | "high" | "watch"
  title: string
  detail: string
  href: string
}

export interface SecretaryCommandReport {
  generatedAt: string
  state: StateRollup
  workflows: ReturnType<typeof summarizeOversight>
  byFlow: ReturnType<typeof rollupByFlow>
  pendingRoles: ReturnType<typeof pendingByRole>
  aging: ReturnType<typeof agingProfile>
  priorities: SecretaryPriority[]
  evidence: { source: string; mode: "live-store" | "reference-register"; asOf: string }[]
}

export function buildSecretaryCommandReport(state: StateRollup, oversight: OversightItem[], generatedAt = new Date().toISOString()): SecretaryCommandReport {
  const workflows = summarizeOversight(oversight)
  const aging = agingProfile(oversight, Date.parse(generatedAt))
  const overSevenDays = aging.find((row) => row.bucket === ">7 days")?.count ?? 0
  const priorities: SecretaryPriority[] = []
  if (state.activeIncidents > 0) priorities.push({ id: "active-incidents", severity: "critical", title: "Active school-safety incidents", detail: `${state.activeIncidents} incident(s) require state oversight.`, href: "/safety-incidents" })
  if (state.atRisk > 0) priorities.push({ id: "at-risk", severity: "high", title: "Learner risk register", detail: `${state.atRisk} learner(s) are flagged in the current evidence scope.`, href: "/tracking/challenges" })
  if (overSevenDays > 0) priorities.push({ id: "workflow-aging", severity: "high", title: "Approval SLA breach", detail: `${overSevenDays} workflow item(s) have been idle for more than seven days.`, href: "/governance/oversight" })
  if (state.compliance !== "green") priorities.push({ id: "compliance", severity: state.compliance === "red" ? "critical" : "watch", title: "Compliance intervention", detail: `State evidence rollup is ${state.compliance.toUpperCase()}.`, href: "/governance/compliance" })
  if (state.mandatedGaps > 0) priorities.push({ id: "infrastructure", severity: "watch", title: "Mandated infrastructure gaps", detail: `${state.mandatedGaps} mandated gap(s) remain in the infrastructure register.`, href: "/infrastructure" })

  return {
    generatedAt,
    state,
    workflows,
    byFlow: rollupByFlow(oversight),
    pendingRoles: pendingByRole(oversight),
    aging,
    priorities,
    evidence: [
      { source: "SIS, quality, infrastructure and safety registers", mode: "reference-register", asOf: generatedAt },
      { source: "Cross-process workflow stores", mode: "live-store", asOf: generatedAt },
    ],
  }
}

export function secretaryCommandReportToCsv(report: SecretaryCommandReport): string {
  const rows = [
    ["generated_at", report.generatedAt, ""],
    ["state", "students", report.state.students],
    ["state", "schools", report.state.schools],
    ["state", "districts", report.state.districts],
    ["state", "average_attendance", report.state.avgAttendance],
    ["state", "nipun_on_track_pct", report.state.nipunOnTrackPct],
    ["state", "scheme_coverage_pct", report.state.schemeCoveragePct],
    ["state", "at_risk_learners", report.state.atRisk],
    ["state", "active_incidents", report.state.activeIncidents],
    ["workflow", "in_progress", report.workflows.inProgress],
    ["workflow", "approved", report.workflows.approved],
    ["workflow", "rejected", report.workflows.rejected],
    ...report.priorities.map((priority) => ["priority", priority.severity, `${priority.title}: ${priority.detail}`]),
  ]
  return ["section,metric,value", ...rows.map((row) => row.map((value) => csvField(String(value))).join(","))].join("\r\n") + "\r\n"
}

