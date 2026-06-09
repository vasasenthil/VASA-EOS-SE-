// VASA-EOS(SE) — environment contract & validation (deployment-grade).
// Declares the variables the platform needs and reports their presence (never their
// values). Used by the readiness probe and the operations screens to make a
// misconfigured deployment obvious instead of failing mysteriously at runtime.

export interface EnvVarDef {
  name: string
  required: boolean
  purpose: string
}

export const ENV_CONTRACT: EnvVarDef[] = [
  { name: "NEXT_PUBLIC_SUPABASE_URL", required: true, purpose: "Supabase project URL (auth + data plane)" },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true, purpose: "Supabase anon key (browser auth)" },
  { name: "SUPABASE_SERVICE_ROLE_KEY", required: false, purpose: "Service-role key — enables durable persistence (server only)" },
  { name: "DEMO_PASSWORD", required: false, purpose: "Shared demo password (non-production walkthrough only)" },
]

export interface EnvVarStatus extends EnvVarDef {
  present: boolean
}

export interface EnvReport {
  /** "production" once durable persistence is configured; "demo" otherwise. */
  mode: "production" | "demo"
  vars: EnvVarStatus[]
  missingRequired: string[]
  /** True when every required variable is present. */
  ok: boolean
}

/** Build a presence report from an env-like map (pure; injectable for tests). */
export function buildEnvReport(env: Record<string, string | undefined>): EnvReport {
  const vars: EnvVarStatus[] = ENV_CONTRACT.map((d) => ({ ...d, present: Boolean(env[d.name]) }))
  const missingRequired = vars.filter((v) => v.required && !v.present).map((v) => v.name)
  return {
    mode: env.SUPABASE_SERVICE_ROLE_KEY ? "production" : "demo",
    vars,
    missingRequired,
    ok: missingRequired.length === 0,
  }
}

/** The live report for the running process. */
export function envReport(): EnvReport {
  return buildEnvReport(process.env as Record<string, string | undefined>)
}

export type PreflightSeverity = "blocker" | "warning"

export interface PreflightIssue {
  severity: PreflightSeverity
  check: string
  detail: string
}

/**
 * Production-deployment preflight: blocking/warning issues a go-live must resolve.
 * Pure (takes the env map). A deploy gate runs this and refuses to promote on any
 * blocker. Demo mode (no service-role key) reports a single blocker by design.
 */
export function preflightProduction(env: Record<string, string | undefined>): PreflightIssue[] {
  const issues: PreflightIssue[] = []
  const has = (k: string) => Boolean(env[k])

  if (!has("SUPABASE_SERVICE_ROLE_KEY")) {
    issues.push({ severity: "blocker", check: "Durable persistence", detail: "SUPABASE_SERVICE_ROLE_KEY unset — running in-memory (data is not durable)." })
  }
  if (!has("NEXT_PUBLIC_SUPABASE_URL") || !has("NEXT_PUBLIC_SUPABASE_ANON_KEY")) {
    issues.push({ severity: "blocker", check: "Authentication", detail: "Supabase URL/anon key unset — real auth is not active." })
  }
  if (env.DEMO_PASSWORD) {
    issues.push({ severity: "blocker", check: "No demo credentials in prod", detail: "DEMO_PASSWORD is set — remove the shared demo password before go-live." })
  }
  if (!has("OTEL_EXPORTER_OTLP_ENDPOINT")) {
    issues.push({ severity: "warning", check: "Trace shipping", detail: "OTEL_EXPORTER_OTLP_ENDPOINT unset — traces are buffered locally, not shipped." })
  }
  return issues
}

export interface PreflightReport {
  ready: boolean
  blockers: number
  warnings: number
  issues: PreflightIssue[]
}

export function preflightReport(env: Record<string, string | undefined> = process.env as Record<string, string | undefined>): PreflightReport {
  const issues = preflightProduction(env)
  const blockers = issues.filter((i) => i.severity === "blocker").length
  return { ready: blockers === 0, blockers, warnings: issues.length - blockers, issues }
}
