import assert from "node:assert/strict"
import test from "node:test"

import { classifyApiRoute, scanApiRoutePolicies } from "@/lib/auth/route-policy"
import { buildP0ReadinessReport, scanProductionMemoryFallbackGuards } from "@/lib/production/p0-readiness"
import { buildCutoverReport } from "@/lib/production/cutover"
import { ProductionRuntimeGuardError, assertNonProductionMemoryAdapter } from "@/lib/runtime/production-guard"
import type { IntegrationStatus } from "@/lib/integrations/status"

const rows: IntegrationStatus[] = ["pfms", "dbt", "apaar", "digilocker", "language"].map((key) => ({
  key,
  label: key.toUpperCase(),
  port: key,
  note: "",
  flag: `INTEGRATION_${key.toUpperCase()}`,
  mode: "live",
  env: [],
  liveReady: true,
}))

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
  OUTBOX_WORKER_HEARTBEAT_AT: "2026-07-15T23:59:30.000Z",
  SLA_WORKER_HEARTBEAT_AT: "2026-07-15T23:59:10.000Z",
  RECONCILIATION_WORKER_HEARTBEAT_AT: "2026-07-15T23:59:50.000Z",
  MIGRATIONS_FULLY_APPLIED: "true",
  VAULT_ADDR: "https://vault.tn.gov.in",
  AUDIT_SINK_WRITABLE: "true",
  TENANT_RLS_VERIFIED: "true",
}

test("P0 scanner verifies protected API routes are classified and guarded", () => {
  const report = scanApiRoutePolicies(process.cwd())
  assert.ok(report.total > 0)
  assert.ok(report.protectedRoutes > 0)
  assert.equal(report.ok, true)
  assert.deepEqual(report.unguardedProtectedRoutes, [])
})

test("new governance exports fail closed unless explicitly declared public", () => {
  assert.equal(classifyApiRoute("app/api/governance/public-communication/csv/route.ts"), "public")
  assert.equal(classifyApiRoute("app/api/governance/inventory-ledger/csv/route.ts"), "protected")
  assert.equal(classifyApiRoute("app/api/governance/new-child-risk-export/csv/route.ts"), "protected")
  assert.equal(classifyApiRoute("app/api/governance/new-policy-pack/markdown/route.ts"), "protected")
})

test("critical runtime memory fallbacks include production guards", () => {
  const report = scanProductionMemoryFallbackGuards(process.cwd())
  assert.equal(report.ok, true)
  assert.deepEqual(report.missingGuardFiles, [])
})

test("memory adapters throw when used in production", () => {
  assert.throws(() => assertNonProductionMemoryAdapter("test-adapter", { NODE_ENV: "production" }), ProductionRuntimeGuardError)
  assert.doesNotThrow(() => assertNonProductionMemoryAdapter("test-adapter", { NODE_ENV: "test" }))
})

test("production cutover passes P0 route-auth and tenant-RLS evidence when scanners are clean", () => {
  const report = buildCutoverReport(readyEnv, rows, () => "2026-07-16T00:00:00.000Z", { dbReady: true, migrationsApplied: true, auditSinkWritable: true, memoryFallbacksBlocked: true })
  assert.ok(report.gates.some((gate) => gate.id === "p0:route-auth-coverage" && gate.status === "pass"))
  assert.ok(report.gates.some((gate) => gate.id === "p0:tenant-rls" && gate.status === "pass"))
})

test("P0 readiness report combines route and memory guard evidence", () => {
  const report = buildP0ReadinessReport(process.cwd())
  assert.equal(report.memoryFallbacks.ok, true)
  assert.equal(report.routePolicies.ok, true)
  assert.equal(report.tenantRls.ok, true)
  assert.equal(report.tenantRls.blanketTenantPolicyMigration, true)
  assert.deepEqual(report.tenantRls.missingTenantPolicyTables, [])
})
