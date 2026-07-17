import { preflightReport, type PreflightIssue } from "@/lib/env"
import { integrationStatuses, type IntegrationStatus } from "@/lib/integrations/status"

export type CutoverSeverity = "blocker" | "warning"
export type CutoverGateStatus = "pass" | "warn" | "fail"

export interface CutoverGate {
  id: string
  label: string
  status: CutoverGateStatus
  severity: CutoverSeverity
  detail: string
}

export interface CutoverReport {
  ready: boolean
  blockers: number
  warnings: number
  checkedAt: string
  gates: CutoverGate[]
}

const PHASE6_PORTS = ["pfms", "dbt", "apaar", "digilocker", "language"] as const
const REQUIRED_WORKER_VARS = ["OUTBOX_WORKER_ENABLED", "SLA_MONITOR_WORKER_ENABLED"] as const
const RECOMMENDED_OBSERVABILITY_VARS = ["OTEL_EXPORTER_OTLP_ENDPOINT", "SENTRY_DSN"] as const

function gate(id: string, label: string, status: CutoverGateStatus, severity: CutoverSeverity, detail: string): CutoverGate {
  return { id, label, status, severity, detail }
}

function boolEnv(value: string | undefined): boolean {
  return ["1", "true", "yes", "on"].includes(String(value ?? "").toLowerCase())
}

function envGate(env: Record<string, string | undefined>): CutoverGate[] {
  const preflight = preflightReport(env)
  return preflight.issues.map((issue: PreflightIssue) =>
    gate(`env:${issue.check.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, issue.check, issue.severity === "blocker" ? "fail" : "warn", issue.severity, issue.detail),
  )
}

function integrationGate(rows: IntegrationStatus[]): CutoverGate[] {
  return PHASE6_PORTS.map((key) => {
    const row = rows.find((item) => item.key === key)
    if (!row) return gate(`integration:${key}`, `Phase 6 integration ${key}`, "fail", "blocker", "Port is not registered.")
    if (row.mode !== "live") return gate(`integration:${key}`, row.label, "fail", "blocker", `${row.flag}=live is required for production cutover.`)
    if (!row.liveReady) {
      const missing = row.env.filter((item) => item.required && !item.present).map((item) => item.name).join(", ")
      return gate(`integration:${key}`, row.label, "fail", "blocker", `Required live configuration missing: ${missing || "unknown"}.`)
    }
    return gate(`integration:${key}`, row.label, "pass", "blocker", "Live adapter enabled and required configuration is present.")
  })
}

function workerGate(env: Record<string, string | undefined>): CutoverGate[] {
  return REQUIRED_WORKER_VARS.map((name) => {
    const enabled = boolEnv(env[name])
    return gate(
      `worker:${name.toLowerCase()}`,
      name,
      enabled ? "pass" : "fail",
      "blocker",
      enabled ? "Worker explicitly enabled for production runtime." : `${name}=true is required so durable background processing is active.`,
    )
  })
}

function observabilityGate(env: Record<string, string | undefined>): CutoverGate[] {
  return RECOMMENDED_OBSERVABILITY_VARS.map((name) => {
    const present = Boolean(env[name])
    return gate(
      `observability:${name.toLowerCase()}`,
      name,
      present ? "pass" : "warn",
      "warning",
      present ? "Configured." : `${name} is recommended before production cutover for incident response.`,
    )
  })
}

export function buildCutoverReport(
  env: Record<string, string | undefined>,
  rows: IntegrationStatus[] = integrationStatuses(),
  now: () => string = () => new Date().toISOString(),
): CutoverReport {
  const gates = [...envGate(env), ...integrationGate(rows), ...workerGate(env), ...observabilityGate(env)]
  const blockers = gates.filter((item) => item.status === "fail" && item.severity === "blocker").length
  const warnings = gates.filter((item) => item.status === "warn").length
  return { ready: blockers === 0, blockers, warnings, checkedAt: now(), gates }
}

export function productionCutoverReport(now?: () => string): CutoverReport {
  return buildCutoverReport(process.env as Record<string, string | undefined>, integrationStatuses(), now)
}
