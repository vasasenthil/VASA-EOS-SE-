import { integrationModes } from "@/lib/integrations/config"
import { INFRASTRUCTURE, infraSummary } from "@/lib/infrastructure"
import { QUALITY, qualitySummary } from "@/lib/quality"
import { SIS_ROSTER, summarise } from "@/lib/sis"
import { complianceLabel, stateRollup } from "@/lib/portal-data"
import { stakeholderWorkflowSummary } from "@/lib/workflow/stakeholders"
import { listOutboxEvents } from "@/lib/events/outbox-publisher"
import { listModels, listPredictions } from "@/lib/ml/store"
import { listSchemes } from "@/lib/stores/scheme-store"
import { listDeadLetters } from "@/lib/events/dead-letters"
import type { KpiTile, ModuleEntry } from "@/components/portal-dashboard"

export interface DashboardSignal {
  label: string
  value: string
  tone: "good" | "watch" | "risk" | "neutral"
}

export interface LiveDashboardData {
  title: string
  description: string
  tierLabel: string
  kpis: KpiTile[]
  modules: ModuleEntry[]
  signals: DashboardSignal[]
  sourceSummary: string
  sourceWarnings?: string[]
}

function pct(n: number): string {
  return `${Math.round(n)}%`
}


async function modelFallbackCount(): Promise<number> {
  return (await listModels()).filter((m) => m.status === "active").length
}

export function teacherDashboardData(): LiveDashboardData {
  const sis = summarise()
  const roster = SIS_ROSTER
  const flagged = roster.filter((s) => s.riskFlags.length > 0)
  const sections = new Set(roster.map((s) => s.className)).size
  return {
    title: "Teacher Dashboard",
    description: "Live class operations from SIS, attendance, early-warning and lesson workflow signals.",
    tierLabel: "School",
    kpis: [
      { label: "Learners in scope", value: String(sis.total), hint: `${sections} class sections` },
      { label: "Avg attendance", value: pct(sis.avgAttendance), hint: "SIS roster" },
      { label: "At-risk learners", value: String(flagged.length), hint: "early-warning queue" },
      { label: "NIPUN on-track", value: pct((roster.filter((s) => s.nipunStatus === "on-track").length / Math.max(roster.length, 1)) * 100), hint: "diagnostic status" },
    ],
    modules: [
      { label: "Attendance Register", href: "/attendance-register" },
      { label: "Lesson Plans", href: "/lesson-plans" },
      { label: "Assignments", href: "/assignments" },
      { label: "Early Warning", href: "/early-warning" },
      { label: "Report Cards", href: "/report-cards" },
      { label: "Teacher CPD", href: "/teacher-cpd" },
    ],
    signals: flagged.map((s) => ({ label: s.name, value: s.riskFlags.join(", "), tone: "risk" })),
    sourceSummary: "Bound to SIS_ROSTER, diagnostic risk flags and attendance aggregates.",
  }
}

export async function studentDashboardData(): Promise<LiveDashboardData> {
  const learner = SIS_ROSTER[0]
  const activeModels = await modelFallbackCount()
  return {
    title: "Student Dashboard",
    description: `${learner.name} · ${learner.className} · APAAR anchored learning, attendance, benefits and credentials.`,
    tierLabel: "Learner",
    kpis: [
      { label: "Attendance", value: pct(learner.attendancePct), hint: learner.currentSchoolUdise ?? "school linked" },
      { label: "NIPUN status", value: learner.nipunStatus === "on-track" ? "On track" : "Needs support" },
      { label: "Schemes", value: String(learner.schemes.length), hint: learner.schemes.join(", ") },
      { label: "Active ML models", value: String(activeModels), hint: "personalised advisory" },
    ],
    modules: [
      { label: "Learning Pathways", href: "/learning-pathways" },
      { label: "Assignments", href: "/assignments" },
      { label: "Grades", href: "/grades" },
      { label: "Report Cards", href: "/report-cards" },
      { label: "Scholarship / DBT", href: "/dbt-scholarship" },
      { label: "Credentials", href: "/credentials" },
    ],
    signals: [
      { label: "APAAR", value: learner.apaarId, tone: "neutral" },
      { label: "Journey", value: learner.journeyStatus, tone: learner.journeyStatus === "enrolled" ? "good" : "watch" },
      { label: "Risk flags", value: learner.riskFlags.length ? learner.riskFlags.join(", ") : "None", tone: learner.riskFlags.length ? "risk" : "good" },
    ],
    sourceSummary: "Bound to student SIS record, scheme participation and ML model registry state.",
  }
}

export function parentDashboardData(): LiveDashboardData {
  const learner = SIS_ROSTER[1]
  return {
    title: "Parent Dashboard",
    description: `Guardian view for ${learner.name}: attendance, assessment, benefits and school communications.`,
    tierLabel: "Family",
    kpis: [
      { label: "Attendance", value: pct(learner.attendancePct), hint: learner.attendancePct < 75 ? "intervention required" : "within target" },
      { label: "Support flags", value: String(learner.riskFlags.length), hint: learner.riskFlags.join(", ") || "none" },
      { label: "Benefit schemes", value: String(learner.schemes.length) },
      { label: "NIPUN", value: learner.nipunStatus === "on-track" ? "On track" : "Needs support" },
    ],
    modules: [
      { label: "Attendance", href: "/attendance" },
      { label: "Report Cards", href: "/report-cards" },
      { label: "PTM", href: "/ptm" },
      { label: "Fees", href: "/fees" },
      { label: "Consent", href: "/consent" },
      { label: "Grievance", href: "/grievance" },
    ],
    signals: [
      { label: "Student", value: `${learner.className} · ${learner.apaarId}`, tone: "neutral" },
      { label: "Attendance watch", value: learner.attendancePct < 75 ? "Yes" : "No", tone: learner.attendancePct < 75 ? "risk" : "good" },
      { label: "Benefits", value: learner.schemes.join(", "), tone: "good" },
    ],
    sourceSummary: "Bound to SIS roster, scheme enrolments and student risk flags.",
  }
}

export interface GovernanceDashboardDependencies {
  listOutboxEvents: typeof listOutboxEvents
}

const GOVERNANCE_DEPENDENCIES: GovernanceDashboardDependencies = { listOutboxEvents }

/**
 * Build the state overview without allowing one operational dependency to take
 * down the whole governance surface. Unavailable telemetry is rendered as
 * unavailable (not zero) and accompanied by an operator-visible warning.
 */
export async function governanceDashboardData(dependencies: GovernanceDashboardDependencies = GOVERNANCE_DEPENDENCIES): Promise<LiveDashboardData> {
  const r = stateRollup()
  const workflow = stakeholderWorkflowSummary()
  let pendingOutbox: number | null = null
  const sourceWarnings: string[] = []
  try {
    pendingOutbox = (await dependencies.listOutboxEvents()).filter((event) => event.status === "pending").length
  } catch {
    sourceWarnings.push("Event-backbone telemetry is unavailable. Check database connectivity and the platform_outbox migration; the value is not being reported as zero.")
  }
  return {
    title: "Governance Dashboard",
    description: "Statewide control plane backed by SIS, quality, infrastructure, workflow and event-backbone telemetry.",
    tierLabel: "State",
    kpis: [
      { label: "Schools", value: String(r.schools) },
      { label: "Students", value: String(r.students) },
      { label: "Workflow lanes", value: String(workflow.lanes), hint: `${workflow.dynamicWorkflows} dynamic` },
      { label: "Pending outbox", value: pendingOutbox === null ? "Unavailable" : String(pendingOutbox), hint: pendingOutbox === null ? "source degraded" : "event backbone" },
    ],
    modules: [
      { label: "Stakeholder Workflow Matrix", href: "/workflows/stakeholders" },
      { label: "Schemes", href: "/schemes" },
      { label: "Metrics", href: "/metrics" },
      { label: "Dead Letters", href: "/admin/dead-letters" },
      { label: "Data Platform", href: "/data-platform" },
      { label: "Audit Trail", href: "/audit-trail" },
      { label: "Readiness Backlog", href: "/governance/readiness" },
    ],
    signals: [
      { label: "Compliance", value: complianceLabel(r.compliance), tone: r.compliance === "green" ? "good" : "watch" },
      { label: "Infrastructure readiness", value: pct(r.infraReadiness), tone: r.infraReadiness >= 80 ? "good" : "watch" },
      { label: "Active incidents", value: String(r.activeIncidents), tone: r.activeIncidents ? "risk" : "good" },
    ],
    sourceSummary: "Bound to portal rollups and workflow runtime summary; event-backbone telemetry is reported only when its durable source responds.",
    sourceWarnings,
  }
}

export function crccDashboardData(): LiveDashboardData {
  const r = stateRollup()
  const q = qualitySummary()
  return {
    title: "CRC Coordinator Dashboard",
    description: "Cluster field-operations cockpit for visits, mentoring, NIPUN support and school quality follow-up.",
    tierLabel: "Cluster",
    kpis: [
      { label: "Schools", value: String(r.schools) },
      { label: "NIPUN on-track", value: pct(r.nipunOnTrackPct), hint: "cluster learning" },
      { label: "At-risk learners", value: String(r.atRisk), hint: "mentoring queue" },
      { label: "High-priority visits", value: String(q.highPriority), hint: "inspection quality" },
    ],
    modules: [
      { label: "Inspections", href: "/inspections" },
      { label: "CPD Mentoring", href: "/cpd" },
      { label: "Diagnostic", href: "/diagnostic" },
      { label: "Remedial", href: "/remedial" },
      { label: "Attendance", href: "/attendance" },
      { label: "Grievance", href: "/grievance" },
    ],
    signals: QUALITY.filter((s) => s.inspectionPriority !== "low").map((s) => ({ label: s.name, value: `${s.inspectionPriority} priority · last ${s.lastInspected}`, tone: s.inspectionPriority === "high" ? "risk" : "watch" })),
    sourceSummary: "Bound to quality index, SIS NIPUN status and attendance rollups.",
  }
}

export async function vendorDashboardData(): Promise<LiveDashboardData> {
  const adapters = Object.keys(integrationModes)
  const live = Object.entries(integrationModes).filter(([, mode]) => mode === "live")
  const predictions = (await listPredictions()).length
  return {
    title: "EdTech Vendor Dashboard",
    description: "Partner sandbox with integration readiness, SDK surfaces, outcome reporting and reconciliation signals.",
    tierLabel: "Ecosystem",
    kpis: [
      { label: "Adapters", value: String(adapters.length), hint: "India Stack seams" },
      { label: "Live integrations", value: String(live.length), hint: live.map(([k]) => k).join(", ") || "mock-backed" },
      { label: "ML predictions", value: String(predictions), hint: "outcome logs" },
      { label: "Quality index", value: String(qualitySummary().avgIndex), hint: "school quality" },
    ],
    modules: [
      { label: "Integrations", href: "/integrations" },
      { label: "API Gateway", href: "/architecture" },
      { label: "Data Platform", href: "/data-platform" },
      { label: "Content", href: "/content" },
      { label: "Tracking Reports", href: "/tracking/reports" },
      { label: "Metrics", href: "/metrics" },
    ],
    signals: adapters.slice(0, 6).map((key) => ({ label: key.toUpperCase(), value: integrationModes[key as keyof typeof integrationModes], tone: integrationModes[key as keyof typeof integrationModes] === "live" ? "good" : "watch" })),
    sourceSummary: "Bound to integration adapter config, ML prediction log and quality summaries.",
  }
}

export async function researcherDashboardData(): Promise<LiveDashboardData> {
  const r = stateRollup()
  const models = await listModels()
  return {
    title: "Researcher Dashboard",
    description: "Privacy-preserving analytics workspace for anonymised cohorts, model telemetry and outcome studies.",
    tierLabel: "National",
    kpis: [
      { label: "Anon cohort", value: String(r.students), hint: "SIS records" },
      { label: "Schools", value: String(r.schools) },
      { label: "CWSN records", value: String(r.cwsn), hint: "RPwD categories" },
      { label: "Model versions", value: String(models.length), hint: "registry" },
    ],
    modules: [
      { label: "Data Platform", href: "/data-platform" },
      { label: "Data Lineage", href: "/data-lineage" },
      { label: "ML Models", href: "/api/ml" },
      { label: "Adoption", href: "/adoption" },
      { label: "Consent", href: "/consent" },
      { label: "Accessibility / CWSN", href: "/cwsn" },
    ],
    signals: [
      { label: "Girls", value: String(r.girls), tone: "neutral" },
      { label: "Scheme coverage", value: pct(r.schemeCoveragePct), tone: r.schemeCoveragePct >= 80 ? "good" : "watch" },
      { label: "Quality index", value: String(r.avgQualityIndex), tone: r.avgQualityIndex >= 75 ? "good" : "watch" },
    ],
    sourceSummary: "Bound to anonymised SIS rollup, CWSN flags, ML registry and quality summaries.",
  }
}

export async function publicDashboardData(): Promise<LiveDashboardData> {
  const r = stateRollup()
  const schemes = await listSchemes().catch(() => [])
  const deadLetters = await listDeadLetters({ status: "open" }).catch(() => [])
  return {
    title: "Public / Citizen Dashboard",
    description: "Transparency portal for schools, schemes, grievances, RTI and public accountability indicators.",
    tierLabel: "Public",
    kpis: [
      { label: "Schools", value: String(r.schools), hint: "known register" },
      { label: "Students", value: String(r.students) },
      { label: "Schemes", value: String(schemes.length || r.distinctSchemes), hint: schemes.length ? "runtime store" : "SIS participation" },
      { label: "Open platform failures", value: String(deadLetters.length), hint: "operator queue" },
    ],
    modules: [
      { label: "NEP Tracker", href: "/tracking/dashboard" },
      { label: "School Registry", href: "/school-registry" },
      { label: "Schemes", href: "/schemes" },
      { label: "RTI", href: "/rti" },
      { label: "Feedback", href: "/feedback" },
      { label: "Grievance", href: "/grievance" },
    ],
    signals: [
      { label: "Compliance", value: complianceLabel(r.compliance), tone: r.compliance === "green" ? "good" : "watch" },
      { label: "Infrastructure readiness", value: pct(infraSummary(INFRASTRUCTURE).avgReadiness), tone: r.infraReadiness >= 80 ? "good" : "watch" },
      { label: "Scheme coverage", value: pct(r.schemeCoveragePct), tone: r.schemeCoveragePct >= 80 ? "good" : "watch" },
    ],
    sourceSummary: "Bound to public-safe rollups, scheme runtime store and dead-letter health state.",
  }
}
