import { readFileSync } from "node:fs"
import { test } from "node:test"
import assert from "node:assert/strict"
import { ENV_CONTRACT } from "@/lib/env"

const example = readFileSync(".env.example", "utf8")

function hasEnv(name: string): boolean {
  return new RegExp(`(^|\\n)#?\\s*${name}=`).test(example)
}

const integrationVars = [
  "INTEGRATION_PFMS",
  "PFMS_BASE_URL",
  "PFMS_API_KEY",
  "INTEGRATION_DBT",
  "DBT_BASE_URL",
  "DBT_API_KEY",
  "INTEGRATION_APAAR",
  "APAAR_BASE_URL",
  "APAAR_API_KEY",
  "INTEGRATION_DIGILOCKER",
  "DIGILOCKER_BASE_URL",
  "DIGILOCKER_API_KEY",
  "INTEGRATION_BHASHINI",
  "BHASHINI_INFERENCE_URL",
  "BHASHINI_API_KEY",
  "INTEGRATION_AADHAAR",
  "AADHAAR_BASE_URL",
  "AADHAAR_API_KEY",
  "INTEGRATION_UDISE",
  "UDISE_BASE_URL",
  "INTEGRATION_DIKSHA",
  "DIKSHA_BASE_URL",
  "INTEGRATION_EMIS",
  "EMIS_BASE_URL",
  "EMIS_API_KEY",
  "INTEGRATION_TNPORTAL",
  "TNPORTAL_BASE_URL",
  "TNPORTAL_API_KEY",
  "INTEGRATION_EXAMS",
  "EXAMS_BASE_URL",
  "EXAMS_API_KEY",
  "INTEGRATION_RETRIEVAL",
  "RETRIEVAL_BASE_URL",
  "RETRIEVAL_API_KEY",
  "INTEGRATION_AGENTS",
  "AGENTS_API_KEY",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "PFMS_API_SECRET",
  "PFMS_HMAC_ALGORITHM",
  "PFMS_TIMEOUT_MS",
  "PFMS_MAX_RETRIES",
  "APAAR_TIMEOUT_MS",
  "DIGILOCKER_CLIENT_ID",
  "DIGILOCKER_CLIENT_SECRET",
  "DIGILOCKER_REDIRECT_URI",
  "BHASHINI_USER_ID",
  "BHASHINI_TIMEOUT_MS",
  "INTEGRATION_NDEAR",
  "NDEAR_BASE_URL",
  "NDEAR_API_KEY",
  "NDEAR_TIMEOUT_MS",
] as const

const cutoverVars = [
  "OUTBOX_WORKER_ENABLED",
  "SLA_MONITOR_WORKER_ENABLED",
  "OUTBOX_WORKER_HEARTBEAT_AT",
  "SLA_WORKER_HEARTBEAT_AT",
  "RECONCILIATION_WORKER_HEARTBEAT_AT",
  "MIGRATIONS_FULLY_APPLIED",
  "VAULT_ADDR",
  "KMS_KEY_URI",
  "SOVEREIGN_KMS_KEY_URI",
  "AUDIT_SINK_WRITABLE",
  "CUTOVER_SHARED_SECRET",
  "ENABLE_OUTBOX_DISPATCHER_WORKER",
  "ENABLE_SLA_MONITOR_WORKER",
  "ENABLE_DRIFT_MONITOR_WORKER",
  "ENABLE_RETRAINING_ORCHESTRATOR_WORKER",
  "ENABLE_PFMS_RECONCILIATION_WORKER",
  "OTEL_EXPORTER_OTLP_ENDPOINT",
  "SENTRY_DSN",
] as const

test(".env.example documents every environment contract variable", () => {
  for (const envVar of ENV_CONTRACT) {
    assert.equal(hasEnv(envVar.name), true, `${envVar.name} missing from .env.example`)
  }
})

test(".env.example documents production cutover and external integration variables", () => {
  for (const name of [...integrationVars, ...cutoverVars]) {
    assert.equal(hasEnv(name), true, `${name} missing from .env.example`)
  }
})

test(".env.example defaults externally controlled integrations to mock mode", () => {
  const liveDefaults = example.match(/^INTEGRATION_[A-Z]+\s*=\s*live$/gm) ?? []
  assert.deepEqual(liveDefaults, [])
})
