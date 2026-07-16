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
] as const

const cutoverVars = [
  "OUTBOX_WORKER_ENABLED",
  "SLA_MONITOR_WORKER_ENABLED",
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
