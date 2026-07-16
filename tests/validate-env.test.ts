import { test } from "node:test"
import assert from "node:assert/strict"
import { validateEnvironment } from "../scripts/validate-env"

const validEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  DATABASE_URL: "postgres://user:pass@example.com:5432/db?sslmode=require",
  OUTBOX_WORKER_ENABLED: "true",
  SLA_MONITOR_WORKER_ENABLED: "true",
  ENABLE_OUTBOX_DISPATCHER_WORKER: "true",
  ENABLE_SLA_MONITOR_WORKER: "true",
  OTEL_EXPORTER_OTLP_ENDPOINT: "https://otel.example.com/v1/traces",
  SENTRY_DSN: "https://public@example.ingest.sentry.io/project",
}

test("validateEnvironment passes a fully configured production baseline", () => {
  const result = validateEnvironment(validEnv)
  assert.equal(result.ok, true)
  assert.equal(result.errors, 0)
})

test("validateEnvironment fails closed for missing persistence, auth, and workers", () => {
  const result = validateEnvironment({})
  assert.equal(result.ok, false)
  assert.ok(result.issues.some((issue) => issue.variable === "SUPABASE_SERVICE_ROLE_KEY"))
  assert.ok(result.issues.some((issue) => issue.variable === "DATABASE_URL"))
  assert.ok(result.issues.some((issue) => issue.variable === "OUTBOX_WORKER_ENABLED"))
  assert.ok(result.issues.some((issue) => issue.variable === "ENABLE_OUTBOX_DISPATCHER_WORKER"))
})

test("validateEnvironment rejects placeholders and malformed URLs", () => {
  const result = validateEnvironment({ ...validEnv, NEXT_PUBLIC_SUPABASE_URL: "not-a-url", PFMS_API_KEY: "<pfms-api-key>" })
  assert.equal(result.ok, false)
  assert.ok(result.issues.some((issue) => issue.variable === "NEXT_PUBLIC_SUPABASE_URL"))
  assert.ok(result.issues.some((issue) => issue.variable === "PFMS_API_KEY"))
})

test("validateEnvironment enforces live integration credentials", () => {
  const result = validateEnvironment({ ...validEnv, INTEGRATION_APAAR: "live" })
  assert.equal(result.ok, false)
  assert.ok(result.issues.some((issue) => issue.variable === "APAAR_BASE_URL"))
  assert.ok(result.issues.some((issue) => issue.variable === "APAAR_API_KEY"))
})
