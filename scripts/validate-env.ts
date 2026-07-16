import { readFileSync } from "node:fs"
import { ENV_CONTRACT } from "@/lib/env"

export type EnvSeverity = "error" | "warning"

export interface EnvValidationIssue {
  severity: EnvSeverity
  variable: string
  message: string
}

export interface EnvValidationResult {
  ok: boolean
  errors: number
  warnings: number
  issues: EnvValidationIssue[]
}

const REQUIRED_CUTOVER_VARS = ["OUTBOX_WORKER_ENABLED", "SLA_MONITOR_WORKER_ENABLED"] as const
const RECOMMENDED_OBSERVABILITY_VARS = ["OTEL_EXPORTER_OTLP_ENDPOINT", "SENTRY_DSN"] as const
const URL_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "DATABASE_URL",
  "SUPABASE_DB_URL",
  "OTEL_EXPORTER_OTLP_ENDPOINT",
  "PFMS_BASE_URL",
  "DBT_BASE_URL",
  "APAAR_BASE_URL",
  "DIGILOCKER_BASE_URL",
  "BHASHINI_INFERENCE_URL",
  "AADHAAR_BASE_URL",
  "UDISE_BASE_URL",
  "DIKSHA_BASE_URL",
  "EMIS_BASE_URL",
  "TNPORTAL_BASE_URL",
  "EXAMS_BASE_URL",
  "RETRIEVAL_BASE_URL",
  "AGENTS_API_URL",
  "PUBLIC_BASE_URL",
] as const
const SECRET_OR_KEY_VARS = [
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "PFMS_API_KEY",
  "DBT_API_KEY",
  "APAAR_API_KEY",
  "DIGILOCKER_API_KEY",
  "BHASHINI_API_KEY",
  "AADHAAR_API_KEY",
  "UDISE_API_KEY",
  "EMIS_API_KEY",
  "TNPORTAL_API_KEY",
  "EXAMS_API_KEY",
  "RETRIEVAL_API_KEY",
  "AGENTS_API_KEY",
  "ENCRYPTION_MASTER_KEY",
  "AUDIT_SIGNING_KEY",
] as const
const LIVE_INTEGRATIONS: Record<string, readonly string[]> = {
  INTEGRATION_PFMS: ["PFMS_BASE_URL"],
  INTEGRATION_DBT: ["DBT_BASE_URL", "DBT_API_KEY"],
  INTEGRATION_APAAR: ["APAAR_BASE_URL", "APAAR_API_KEY"],
  INTEGRATION_DIGILOCKER: ["DIGILOCKER_BASE_URL", "DIGILOCKER_API_KEY"],
  INTEGRATION_BHASHINI: ["BHASHINI_INFERENCE_URL", "BHASHINI_API_KEY"],
  INTEGRATION_AADHAAR: ["AADHAAR_BASE_URL", "AADHAAR_API_KEY"],
  INTEGRATION_UDISE: ["UDISE_BASE_URL"],
  INTEGRATION_EMIS: ["EMIS_BASE_URL", "EMIS_API_KEY"],
  INTEGRATION_TNPORTAL: ["TNPORTAL_BASE_URL", "TNPORTAL_API_KEY"],
  INTEGRATION_EXAMS: ["EXAMS_BASE_URL", "EXAMS_API_KEY"],
  INTEGRATION_RETRIEVAL: ["RETRIEVAL_BASE_URL", "RETRIEVAL_API_KEY"],
  INTEGRATION_AGENTS: ["AGENTS_API_KEY"],
}

function parseEnvFile(path: string): Record<string, string> {
  const env: Record<string, string> = {}
  const input = readFileSync(path, "utf8")
  for (const [index, rawLine] of input.split(/\r?\n/).entries()) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line)
    if (!match) throw new Error(`Invalid env syntax at ${path}:${index + 1}`)
    const [, key, rawValue] = match
    env[key] = rawValue.replace(/^['"]|['"]$/g, "")
  }
  return env
}

function envFromArgs(argv: string[]): Record<string, string | undefined> {
  const index = argv.indexOf("--env-file")
  if (index >= 0) {
    const path = argv[index + 1]
    if (!path) throw new Error("--env-file requires a path")
    return { ...process.env, ...parseEnvFile(path) }
  }
  return process.env as Record<string, string | undefined>
}

function isPlaceholder(value: string | undefined): boolean {
  const trimmed = String(value ?? "").trim()
  return !trimmed || /^<[^>]+>$/.test(trimmed) || trimmed.includes("<") || trimmed.includes(">")
}

function isUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return ["http:", "https:", "postgres:"].includes(parsed.protocol)
  } catch {
    return false
  }
}

function add(issues: EnvValidationIssue[], severity: EnvSeverity, variable: string, message: string): void {
  issues.push({ severity, variable, message })
}

export function validateEnvironment(env: Record<string, string | undefined>): EnvValidationResult {
  const issues: EnvValidationIssue[] = []

  for (const item of ENV_CONTRACT.filter((entry) => entry.required)) {
    if (isPlaceholder(env[item.name])) add(issues, "error", item.name, `${item.name} is required: ${item.purpose}.`)
  }
  if (isPlaceholder(env.SUPABASE_SERVICE_ROLE_KEY)) add(issues, "error", "SUPABASE_SERVICE_ROLE_KEY", "Server-side service-role key is required for durable production persistence.")
  if (isPlaceholder(env.DATABASE_URL) && isPlaceholder(env.SUPABASE_DB_URL)) add(issues, "error", "DATABASE_URL", "Set DATABASE_URL or SUPABASE_DB_URL so migrations can connect to Postgres.")
  if (env.DEMO_PASSWORD && !isPlaceholder(env.DEMO_PASSWORD)) add(issues, "error", "DEMO_PASSWORD", "Remove DEMO_PASSWORD before production cutover.")

  for (const name of REQUIRED_CUTOVER_VARS) {
    if (String(env[name]).toLowerCase() !== "true") add(issues, "error", name, `${name}=true is required for durable production workers.`)
  }
  for (const name of RECOMMENDED_OBSERVABILITY_VARS) {
    if (isPlaceholder(env[name])) add(issues, "warning", name, `${name} is recommended for production incident response.`)
  }

  for (const name of URL_VARS) {
    const value = env[name]
    if (!value || isPlaceholder(value)) continue
    if (!isUrl(value)) add(issues, "error", name, `${name} must be a well-formed http(s) or postgres URL.`)
  }
  for (const name of SECRET_OR_KEY_VARS) {
    const value = env[name]
    if (!value) continue
    if (isPlaceholder(value)) add(issues, "error", name, `${name} must be replaced with a non-empty issued secret.`)
  }

  for (const [flag, required] of Object.entries(LIVE_INTEGRATIONS)) {
    if (env[flag] !== "live") continue
    for (const name of required) {
      if (isPlaceholder(env[name])) add(issues, "error", name, `${name} is required when ${flag}=live.`)
    }
  }

  const errors = issues.filter((issue) => issue.severity === "error").length
  return { ok: errors === 0, errors, warnings: issues.length - errors, issues }
}

function print(result: EnvValidationResult): void {
  if (result.issues.length === 0) {
    console.log("Environment validation passed with no issues.")
    return
  }
  for (const issue of result.issues) {
    const prefix = issue.severity === "error" ? "ERROR" : "WARN"
    console.log(`${prefix} ${issue.variable}: ${issue.message}`)
  }
  console.log(`Environment validation ${result.ok ? "passed" : "failed"}: ${result.errors} error(s), ${result.warnings} warning(s).`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = validateEnvironment(envFromArgs(process.argv.slice(2)))
  print(result)
  process.exit(result.ok ? 0 : 1)
}
