import { test } from "node:test"
import assert from "node:assert/strict"
import { buildCutoverReport } from "@/lib/production/cutover"
import type { IntegrationStatus } from "@/lib/integrations/status"

const rows: IntegrationStatus[] = [
  "pfms",
  "dbt",
  "apaar",
  "digilocker",
  "language",
].map((key) => ({ key, label: key.toUpperCase(), port: key, note: "", flag: `INTEGRATION_${key.toUpperCase()}`, mode: "live", env: [], liveReady: true }))

const checkedAt = "2026-07-16T00:00:00.000Z"
const runtimeChecks = { dbReady: true, migrationsApplied: true, auditSinkWritable: true, routeAuthCoverage: true, memoryFallbacksBlocked: true, tenantRlsVerified: true, schemeRoutesReady: true, schemeRpcReady: true, schemeRlsReady: true, governanceInventoryReady: true, acceptancePackReady: true }

const readyEnv = {
  NODE_ENV: "production",
  NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
  SUPABASE_SERVICE_ROLE_KEY: "service",
  INTEGRATION_PFMS: "live",
  INTEGRATION_DBT: "live",
  INTEGRATION_APAAR: "live",
  INTEGRATION_DIGILOCKER: "live",
  INTEGRATION_BHASHINI: "live",
  OUTBOX_WORKER_ENABLED: "true",
  SLA_MONITOR_WORKER_ENABLED: "true",
  OTEL_EXPORTER_OTLP_ENDPOINT: "https://otel.example",
  SENTRY_DSN: "https://sentry.example/1",
  OUTBOX_WORKER_HEARTBEAT_AT: "2026-07-15T23:59:30.000Z",
  SLA_WORKER_HEARTBEAT_AT: "2026-07-15T23:59:10.000Z",
  RECONCILIATION_WORKER_HEARTBEAT_AT: "2026-07-15T23:59:50.000Z",
  MIGRATIONS_FULLY_APPLIED: "true",
  VAULT_ADDR: "https://vault.tn.gov.in",
  AUDIT_SINK_WRITABLE: "true",
  TENANT_RLS_VERIFIED: "true",
}

test("production cutover passes when core env, live integrations and workers are ready", () => {
  const report = buildCutoverReport(readyEnv, rows, () => checkedAt, runtimeChecks)
  assert.equal(report.ready, true)
  assert.equal(report.blockers, 0)
  assert.equal(report.checkedAt, checkedAt)
})

test("production cutover blocks demo credentials and mock Phase 6 ports", () => {
  const report = buildCutoverReport({ ...readyEnv, DEMO_PASSWORD: "demo", INTEGRATION_PFMS: "mock" }, [{ ...rows[0], mode: "mock" }, ...rows.slice(1)], () => checkedAt, runtimeChecks)
  assert.equal(report.ready, false)
  assert.ok(report.gates.some((gate) => gate.id === "env:no-demo-credentials-in-prod" && gate.status === "fail"))
  assert.ok(report.gates.some((gate) => gate.id === "integration:pfms" && gate.status === "fail"))
})

test("production cutover blocks disabled workers and only warns for missing observability", () => {
  const env = { ...readyEnv, OUTBOX_WORKER_ENABLED: "false", SLA_MONITOR_WORKER_ENABLED: "", OTEL_EXPORTER_OTLP_ENDPOINT: "", SENTRY_DSN: "" }
  const report = buildCutoverReport(env, rows, () => checkedAt, runtimeChecks)
  assert.equal(report.ready, false)
  assert.equal(report.gates.filter((gate) => gate.id.startsWith("worker:") && gate.status === "fail").length, 2)
  assert.equal(report.gates.filter((gate) => gate.id.startsWith("observability:") && gate.status === "warn").length, 2)
})

test("production cutover blocks stale heartbeats and missing sovereign runtime dependencies", () => {
  const env = {
    ...readyEnv,
    OUTBOX_WORKER_HEARTBEAT_AT: "2026-07-15T23:55:00.000Z",
    RECONCILIATION_WORKER_HEARTBEAT_AT: "",
    MIGRATIONS_FULLY_APPLIED: "false",
    VAULT_ADDR: "",
    AUDIT_SINK_WRITABLE: "false",
  }
  const report = buildCutoverReport(env, rows, () => checkedAt, { dbReady: false, migrationsApplied: false, auditSinkWritable: false })
  assert.equal(report.ready, false)
  assert.ok(report.gates.some((gate) => gate.id === "runtime:database" && gate.status === "fail"))
  assert.ok(report.gates.some((gate) => gate.id === "runtime:migrations" && gate.status === "fail"))
  assert.ok(report.gates.some((gate) => gate.id === "runtime:secret-manager" && gate.status === "fail"))
  assert.ok(report.gates.some((gate) => gate.id === "runtime:audit-sink" && gate.status === "fail"))
  assert.ok(report.gates.some((gate) => gate.id === "worker-heartbeat:outbox" && gate.status === "fail"))
  assert.ok(report.gates.some((gate) => gate.id === "worker-heartbeat:reconciliation" && gate.status === "fail"))
})

test("production cutover returns database blocker instead of throwing when requireDb fails", () => {
  const report = buildCutoverReport(readyEnv, rows, () => checkedAt, { migrationsApplied: true, auditSinkWritable: true, routeAuthCoverage: true, memoryFallbacksBlocked: true, tenantRlsVerified: true })
  assert.equal(report.ready, false)
  assert.ok(report.gates.some((gate) => gate.id === "runtime:database" && gate.status === "fail"))
})


test("production cutover blocks missing scheme lifecycle and acceptance-pack gates", () => {
  const report = buildCutoverReport(readyEnv, rows, () => checkedAt, { ...runtimeChecks, schemeRoutesReady: false, schemeRpcReady: false, schemeRlsReady: false, governanceInventoryReady: false, acceptancePackReady: false })
  assert.equal(report.ready, false)
  for (const id of ["scheme:routes", "scheme:atomic-rpc", "scheme:tenant-rls", "governance:inventory-ledger", "governance:acceptance-pack"]) {
    assert.ok(report.gates.some((gate) => gate.id === id && gate.status === "fail"), `${id} should block cutover`)
  }
})
