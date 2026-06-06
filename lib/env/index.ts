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
