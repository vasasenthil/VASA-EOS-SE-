#!/usr/bin/env node

import { readFileSync } from "node:fs"
import { z } from "zod"

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
  data?: z.infer<typeof envSchema>
}

const nonPlaceholder = (label: string) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} must be non-empty`)
    .refine((value) => !/^<[^>]+>$/.test(value) && !value.includes("<") && !value.includes(">"), `${label} must be replaced with an issued value`)

const urlValue = (label: string) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} must be non-empty`)
    .url(`${label} must be a valid URL`)
    .refine((value) => !/^<[^>]+>$/.test(value) && !value.includes("<") && !value.includes(">"), `${label} must be replaced with an issued value`)

const postgresUrl = (label: string) =>
  nonPlaceholder(label).superRefine((value, context) => {
    let parsed: URL
    try {
      parsed = new URL(value)
    } catch {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `${label} must be a valid PostgreSQL connection URI` })
      return
    }
    if (!(["postgres:", "postgresql:"] as string[]).includes(parsed.protocol)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `${label} must use postgres:// or postgresql://, not an HTTPS project URL` })
    }
    if (!parsed.hostname || !parsed.pathname || parsed.pathname === "/") {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `${label} must include a database host and database name` })
    }
  })

export const envSchema = z.object({
  // Supabase
  SUPABASE_URL: urlValue("SUPABASE_URL"),
  SUPABASE_SERVICE_ROLE_KEY: nonPlaceholder("SUPABASE_SERVICE_ROLE_KEY"),
  SUPABASE_ANON_KEY: nonPlaceholder("SUPABASE_ANON_KEY"),
  NEXT_PUBLIC_SUPABASE_URL: urlValue("NEXT_PUBLIC_SUPABASE_URL").optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: nonPlaceholder("NEXT_PUBLIC_SUPABASE_ANON_KEY").optional(),
  DATABASE_URL: postgresUrl("DATABASE_URL").optional(),
  SUPABASE_DB_URL: postgresUrl("SUPABASE_DB_URL").optional(),

  // PFMS
  PFMS_BASE_URL: urlValue("PFMS_BASE_URL"),
  PFMS_API_KEY: nonPlaceholder("PFMS_API_KEY"),
  PFMS_API_SECRET: nonPlaceholder("PFMS_API_SECRET"),
  PFMS_HMAC_ALGORITHM: z.enum(["SHA256", "SHA512"]).default("SHA256"),
  PFMS_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  PFMS_MAX_RETRIES: z.coerce.number().int().nonnegative().default(3),

  // APAAR
  APAAR_BASE_URL: urlValue("APAAR_BASE_URL"),
  APAAR_API_KEY: nonPlaceholder("APAAR_API_KEY"),
  APAAR_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),

  // DigiLocker
  DIGILOCKER_BASE_URL: urlValue("DIGILOCKER_BASE_URL"),
  DIGILOCKER_CLIENT_ID: nonPlaceholder("DIGILOCKER_CLIENT_ID"),
  DIGILOCKER_CLIENT_SECRET: nonPlaceholder("DIGILOCKER_CLIENT_SECRET"),
  DIGILOCKER_REDIRECT_URI: urlValue("DIGILOCKER_REDIRECT_URI").optional(),
  DIGILOCKER_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),

  // Bhashini
  BHASHINI_API_KEY: nonPlaceholder("BHASHINI_API_KEY"),
  BHASHINI_USER_ID: nonPlaceholder("BHASHINI_USER_ID"),
  BHASHINI_INFERENCE_URL: urlValue("BHASHINI_INFERENCE_URL").optional(),
  BHASHINI_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),

  // NDEAR
  NDEAR_BASE_URL: urlValue("NDEAR_BASE_URL"),
  NDEAR_API_KEY: nonPlaceholder("NDEAR_API_KEY"),
  NDEAR_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),

  // Workers
  ENABLE_OUTBOX_DISPATCHER_WORKER: z.enum(["true", "false"]),
  ENABLE_SLA_MONITOR_WORKER: z.enum(["true", "false"]),
  ENABLE_DRIFT_MONITOR_WORKER: z.enum(["true", "false"]).optional(),
  ENABLE_RETRAINING_ORCHESTRATOR_WORKER: z.enum(["true", "false"]).optional(),
  ENABLE_PFMS_RECONCILIATION_WORKER: z.enum(["true", "false"]).optional(),

  // Observability
  OTEL_EXPORTER_OTLP_ENDPOINT: urlValue("OTEL_EXPORTER_OTLP_ENDPOINT").optional(),
  SENTRY_DSN: urlValue("SENTRY_DSN").optional(),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
})

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

function issueFromZod(issue: z.ZodIssue): EnvValidationIssue {
  const variable = issue.path.join(".") || "ENV"
  return { severity: "error", variable, message: issue.message }
}

function warning(variable: string, message: string): EnvValidationIssue {
  return { severity: "warning", variable, message }
}

export function validateEnvironment(env: Record<string, string | undefined>): EnvValidationResult {
  const result = envSchema.safeParse(env)
  const issues = result.success ? [] : result.error.issues.map(issueFromZod)

  if (!env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_URL) issues.push(warning("NEXT_PUBLIC_SUPABASE_URL", "Set NEXT_PUBLIC_SUPABASE_URL to the same value as SUPABASE_URL for browser auth."))
  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY && env.SUPABASE_ANON_KEY) issues.push(warning("NEXT_PUBLIC_SUPABASE_ANON_KEY", "Set NEXT_PUBLIC_SUPABASE_ANON_KEY to the same value as SUPABASE_ANON_KEY for browser auth."))
  if (!env.DATABASE_URL && !env.SUPABASE_DB_URL) issues.push(warning("DATABASE_URL", "Set DATABASE_URL or SUPABASE_DB_URL before running migrations."))
  if (env.ENABLE_OUTBOX_DISPATCHER_WORKER === "false") issues.push(warning("ENABLE_OUTBOX_DISPATCHER_WORKER", "Outbox worker is disabled; production cutover will fail until enabled."))
  if (env.ENABLE_SLA_MONITOR_WORKER === "false") issues.push(warning("ENABLE_SLA_MONITOR_WORKER", "SLA monitor worker is disabled; production cutover will fail until enabled."))
  if (env.DEMO_PASSWORD) issues.push({ severity: "error", variable: "DEMO_PASSWORD", message: "Remove DEMO_PASSWORD before production cutover." })

  const errors = issues.filter((issue) => issue.severity === "error").length
  return { ok: errors === 0, errors, warnings: issues.length - errors, issues, data: result.success ? result.data : undefined }
}

function print(result: EnvValidationResult): void {
  if (!result.ok) {
    console.error("❌ Environment validation failed:")
    for (const issue of result.issues) {
      const prefix = issue.severity === "error" ? "ERROR" : "WARN"
      console.error(`   ${prefix} ${issue.variable}: ${issue.message}`)
    }
    console.error("\nPlease copy .env.example to .env and fill in all required values.")
    console.error("See docs/setup/credentials-guide.md for instructions.")
    return
  }

  console.log("✅ Environment validation passed")
  console.log(`   Supabase: ${result.data?.SUPABASE_URL}`)
  console.log(`   PFMS: ${result.data?.PFMS_BASE_URL}`)
  console.log(`   Workers: Outbox=${result.data?.ENABLE_OUTBOX_DISPATCHER_WORKER}, SLA=${result.data?.ENABLE_SLA_MONITOR_WORKER}`)
  for (const issue of result.issues) console.log(`   WARN ${issue.variable}: ${issue.message}`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = validateEnvironment(envFromArgs(process.argv.slice(2)))
  print(result)
  process.exit(result.ok ? 0 : 1)
}
