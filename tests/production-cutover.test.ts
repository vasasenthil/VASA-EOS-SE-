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

const readyEnv = {
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
}

test("production cutover passes when core env, live integrations and workers are ready", () => {
  const report = buildCutoverReport(readyEnv, rows, () => "2026-07-16T00:00:00.000Z")
  assert.equal(report.ready, true)
  assert.equal(report.blockers, 0)
  assert.equal(report.checkedAt, "2026-07-16T00:00:00.000Z")
})

test("production cutover blocks demo credentials and mock Phase 6 ports", () => {
  const report = buildCutoverReport({ ...readyEnv, DEMO_PASSWORD: "demo" }, [{ ...rows[0], mode: "mock" }, ...rows.slice(1)])
  assert.equal(report.ready, false)
  assert.ok(report.gates.some((gate) => gate.id === "env:no-demo-credentials-in-prod" && gate.status === "fail"))
  assert.ok(report.gates.some((gate) => gate.id === "integration:pfms" && gate.status === "fail"))
})

test("production cutover blocks disabled workers and only warns for missing observability", () => {
  const env = { ...readyEnv, OUTBOX_WORKER_ENABLED: "false", SLA_MONITOR_WORKER_ENABLED: "", OTEL_EXPORTER_OTLP_ENDPOINT: "", SENTRY_DSN: "" }
  const report = buildCutoverReport(env, rows)
  assert.equal(report.ready, false)
  assert.equal(report.gates.filter((gate) => gate.id.startsWith("worker:") && gate.status === "fail").length, 2)
  assert.equal(report.gates.filter((gate) => gate.id.startsWith("observability:") && gate.status === "warn").length, 2)
})
