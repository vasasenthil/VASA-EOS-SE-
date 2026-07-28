import { test } from "node:test"
import assert from "node:assert/strict"
import { envSchema, validateEnvironment } from "../scripts/validate-env"

const validEnv = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  DATABASE_URL: "postgres://user:pass@example.com:5432/db?sslmode=require",
  PFMS_BASE_URL: "https://pfms.example.gov.in",
  PFMS_API_KEY: "pfms-api-key",
  PFMS_API_SECRET: "pfms-api-secret",
  APAAR_BASE_URL: "https://apaar.example.gov.in",
  APAAR_API_KEY: "apaar-api-key",
  DIGILOCKER_BASE_URL: "https://digilocker.example.gov.in",
  DIGILOCKER_CLIENT_ID: "digilocker-client-id",
  DIGILOCKER_CLIENT_SECRET: "digilocker-client-secret",
  BHASHINI_API_KEY: "bhashini-api-key",
  BHASHINI_USER_ID: "bhashini-user-id",
  NDEAR_BASE_URL: "https://ndear.example.gov.in",
  NDEAR_API_KEY: "ndear-api-key",
  ENABLE_OUTBOX_DISPATCHER_WORKER: "true",
  ENABLE_SLA_MONITOR_WORKER: "true",
  OTEL_EXPORTER_OTLP_ENDPOINT: "https://otel.example.com/v1/traces",
  SENTRY_DSN: "https://public@example.ingest.sentry.io/project",
}

test("envSchema accepts a fully configured production baseline", () => {
  const result = envSchema.safeParse(validEnv)
  assert.equal(result.success, true)
})

test("validateEnvironment passes a fully configured production baseline", () => {
  const result = validateEnvironment(validEnv)
  assert.equal(result.ok, true)
  assert.equal(result.errors, 0)
})

test("validateEnvironment fails closed for missing required credentials", () => {
  const result = validateEnvironment({})
  assert.equal(result.ok, false)
  assert.ok(result.issues.some((issue) => issue.variable === "SUPABASE_URL"))
  assert.ok(result.issues.some((issue) => issue.variable === "PFMS_API_SECRET"))
  assert.ok(result.issues.some((issue) => issue.variable === "NDEAR_API_KEY"))
})

test("validateEnvironment rejects placeholders and malformed URLs", () => {
  const result = validateEnvironment({ ...validEnv, SUPABASE_URL: "not-a-url", PFMS_API_KEY: "<pfms-api-key>" })
  assert.equal(result.ok, false)
  assert.ok(result.issues.some((issue) => issue.variable === "SUPABASE_URL"))
  assert.ok(result.issues.some((issue) => issue.variable === "PFMS_API_KEY"))
})

test("validateEnvironment rejects a Supabase HTTPS project URL as DATABASE_URL", () => {
  const result = validateEnvironment({ ...validEnv, DATABASE_URL: "https://example.supabase.co" })
  assert.equal(result.ok, false)
  assert.ok(result.issues.some((issue) => issue.variable === "DATABASE_URL" && /postgres:\/\//.test(issue.message)))
})

test("validateEnvironment accepts both PostgreSQL connection URI schemes", () => {
  assert.equal(validateEnvironment({ ...validEnv, DATABASE_URL: "postgres://user:pass@db.example:5432/vasa" }).ok, true)
  assert.equal(validateEnvironment({ ...validEnv, DATABASE_URL: "postgresql://user:pass@db.example:5432/vasa" }).ok, true)
})

test("validateEnvironment recognizes Vercel non-pooling PostgreSQL configuration", () => {
  const { DATABASE_URL, ...withoutCanonical } = validEnv
  const result = validateEnvironment({ ...withoutCanonical, POSTGRES_URL_NON_POOLING: DATABASE_URL })
  assert.equal(result.ok, true)
  assert.ok(!result.issues.some((issue) => issue.variable === "DATABASE_URL"))
})

test("validateEnvironment warns when browser Supabase aliases are omitted", () => {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, ...env } = validEnv
  const result = validateEnvironment(env)
  assert.equal(result.ok, true)
  assert.ok(result.issues.some((issue) => issue.variable === "NEXT_PUBLIC_SUPABASE_URL" && issue.severity === "warning"))
  assert.ok(result.issues.some((issue) => issue.variable === "NEXT_PUBLIC_SUPABASE_ANON_KEY" && issue.severity === "warning"))
})
