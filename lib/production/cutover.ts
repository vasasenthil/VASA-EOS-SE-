import { preflightReport, type PreflightIssue } from "@/lib/env"
import { requireDb } from "@/lib/db/require-db"
import { integrationStatuses, type IntegrationStatus } from "@/lib/integrations/status"
import { buildP0ReadinessReport } from "./p0-readiness"

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

export interface CutoverRuntimeChecks {
  dbReady?: boolean | (() => boolean)
  migrationsApplied?: boolean | (() => boolean)
  auditSinkWritable?: boolean | (() => boolean)
  routeAuthCoverage?: boolean | (() => boolean)
  memoryFallbacksBlocked?: boolean | (() => boolean)
  tenantRlsVerified?: boolean | (() => boolean)
}

const PHASE6_PORTS = ["pfms", "dbt", "apaar", "digilocker", "language"] as const
const REQUIRED_WORKER_VARS = ["OUTBOX_WORKER_ENABLED", "SLA_MONITOR_WORKER_ENABLED"] as const
const CRITICAL_WORKER_HEARTBEATS = ["OUTBOX", "SLA", "RECONCILIATION"] as const
const RECOMMENDED_OBSERVABILITY_VARS = ["OTEL_EXPORTER_OTLP_ENDPOINT", "SENTRY_DSN"] as const
const TWO_MINUTES_MS = 120_000

function gate(id: string, label: string, status: CutoverGateStatus, severity: CutoverSeverity, detail: string): CutoverGate {
  return { id, label, status, severity, detail }
}

function boolEnv(value: string | undefined): boolean {
  return ["1", "true", "yes", "on"].includes(String(value ?? "").toLowerCase())
}

function resolveCheck(check: boolean | (() => boolean) | undefined, fallback: () => boolean): boolean {
  if (typeof check === "boolean") return check
  if (typeof check === "function") return check()
  return fallback()
}

function safeResolveCheck(check: boolean | (() => boolean) | undefined, fallback: () => boolean): boolean {
  try {
    return resolveCheck(check, fallback)
  } catch {
    return false
  }
}

function envGate(env: Record<string, string | undefined>): CutoverGate[] {
  const preflight = preflightReport(env)
  return preflight.issues.map((issue: PreflightIssue) =>
    gate(`env:${issue.check.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, issue.check, issue.severity === "blocker" ? "fail" : "warn", issue.severity, issue.detail),
  )
}

function explicitMockEnvGate(env: Record<string, string | undefined>): CutoverGate[] {
  if (env.NODE_ENV !== "production") return []
  return Object.entries(env)
    .filter(([name, value]) => name.startsWith("INTEGRATION_") && String(value ?? "").toLowerCase() === "mock")
    .map(([name]) => gate(`integration-env:${name.toLowerCase()}`, name, "fail", "blocker", `${name}=mock is forbidden when NODE_ENV=production.`))
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

function workerHeartbeatGate(env: Record<string, string | undefined>, checkedAt: string): CutoverGate[] {
  const nowMs = Date.parse(checkedAt)
  return CRITICAL_WORKER_HEARTBEATS.map((worker) => {
    const value = env[`${worker}_WORKER_HEARTBEAT_AT`]
    const ageMs = value ? nowMs - Date.parse(value) : Number.POSITIVE_INFINITY
    const fresh = Number.isFinite(ageMs) && ageMs >= 0 && ageMs <= TWO_MINUTES_MS
    return gate(
      `worker-heartbeat:${worker.toLowerCase()}`,
      `${worker} worker heartbeat`,
      fresh ? "pass" : "fail",
      "blocker",
      fresh ? `Last heartbeat ${Math.round(ageMs / 1000)}s ago.` : `${worker}_WORKER_HEARTBEAT_AT must be an ISO timestamp within the last 2 minutes.`,
    )
  })
}

function runtimeDependencyGate(env: Record<string, string | undefined>, checks: CutoverRuntimeChecks): CutoverGate[] {
  const dbReady = safeResolveCheck(checks.dbReady, () => {
    requireDb()
    return true
  })
  const migrationsApplied = safeResolveCheck(checks.migrationsApplied, () => boolEnv(env.MIGRATIONS_FULLY_APPLIED))
  const secretManagerReady = Boolean(env.VAULT_ADDR || env.KMS_KEY_URI || env.SOVEREIGN_KMS_KEY_URI)
  const auditSinkWritable = safeResolveCheck(checks.auditSinkWritable, () => boolEnv(env.AUDIT_SINK_WRITABLE))

  return [
    gate("runtime:database", "Durable database connectivity", dbReady ? "pass" : "fail", "blocker", dbReady ? "requireDb() succeeded." : "requireDb() failed; production must fail closed without a DB."),
    gate("runtime:migrations", "Migration ledger", migrationsApplied ? "pass" : "fail", "blocker", migrationsApplied ? "All migrations are marked applied." : "MIGRATIONS_FULLY_APPLIED=true is required after deploy:migrate verification."),
    gate("runtime:secret-manager", "Vault/KMS secret manager", secretManagerReady ? "pass" : "fail", "blocker", secretManagerReady ? "Vault/KMS endpoint configured." : "VAULT_ADDR or KMS_KEY_URI is required for sovereign secret management."),
    gate("runtime:audit-sink", "Immutable audit sink", auditSinkWritable ? "pass" : "fail", "blocker", auditSinkWritable ? "Audit sink is marked writable." : "AUDIT_SINK_WRITABLE=true is required before cutover."),
  ]
}

function p0SafetyGate(env: Record<string, string | undefined>, checks: CutoverRuntimeChecks): CutoverGate[] {
  const routeAuthCoverage = safeResolveCheck(checks.routeAuthCoverage, () => buildP0ReadinessReport().routePolicies.ok)
  const memoryFallbacksBlocked = safeResolveCheck(checks.memoryFallbacksBlocked, () => buildP0ReadinessReport().memoryFallbacks.ok)
  const tenantRlsVerified = safeResolveCheck(checks.tenantRlsVerified, () => boolEnv(env.TENANT_RLS_VERIFIED) && buildP0ReadinessReport().tenantRls.ok)

  return [
    gate("p0:route-auth-coverage", "Universal API route authorization", routeAuthCoverage ? "pass" : "fail", "blocker", routeAuthCoverage ? "Every protected API route is classified and guarded." : "Protected API routes must be classified and guarded before cutover."),
    gate("p0:memory-fallbacks", "Production memory fallback guard", memoryFallbacksBlocked ? "pass" : "fail", "blocker", memoryFallbacksBlocked ? "Critical runtime memory adapters are guarded from production use." : "Critical runtime memory adapters must be blocked in production."),
    gate("p0:tenant-rls", "Tenant RLS policy verification", tenantRlsVerified ? "pass" : "fail", "blocker", tenantRlsVerified ? "Tenant RLS verification is marked complete and static RLS coverage is clean." : "TENANT_RLS_VERIFIED=true and clean tenant RLS policy coverage are required before cutover."),
  ]
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
  runtimeChecks: CutoverRuntimeChecks = {},
): CutoverReport {
  const checkedAt = now()
  const gates = [
    ...envGate(env),
    ...explicitMockEnvGate(env),
    ...integrationGate(rows),
    ...workerGate(env),
    ...workerHeartbeatGate(env, checkedAt),
    ...runtimeDependencyGate(env, runtimeChecks),
    ...p0SafetyGate(env, runtimeChecks),
    ...observabilityGate(env),
  ]
  const blockers = gates.filter((item) => item.status === "fail" && item.severity === "blocker").length
  const warnings = gates.filter((item) => item.status === "warn").length
  return { ready: blockers === 0, blockers, warnings, checkedAt, gates }
}

export function productionCutoverReport(now?: () => string): CutoverReport {
  return buildCutoverReport(process.env as Record<string, string | undefined>, integrationStatuses(), now)
}
