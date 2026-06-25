// VASA-EOS(SE) — secrets-management seam (production-grade security primitive).
//
// Secrets must not be scattered as raw process.env reads, logged, or shipped to the client. This is the one
// retrieval point: a provider-abstracted getSecret() (env-backed today; the Vault/KMS adapter is a documented
// seam), a redactor so a secret never lands in a log, a presence-only report (names + present/absent, never
// values), and a required-secrets check that fails closed. It does NOT make secrets sovereign or HSM-backed —
// that is infrastructure to provision — but it removes the scattered-env-read class of leak. Inject the env for
// testability; defaults to process.env. Pure (given an env) + server-oriented.

export type SecretProvider = "env" | "vault" | "kms"

/** The active provider. 'env' today; swap to 'vault'/'kms' once provisioned (the seam, not the backend). */
export const ACTIVE_PROVIDER: SecretProvider = "env"

export interface SecretRef {
  name: string
  required: boolean
  description: string
}

/** The secrets the platform manages (names only — never values). */
export const MANAGED_SECRETS: SecretRef[] = [
  { name: "SUPABASE_SERVICE_ROLE_KEY", required: false, description: "Supabase service-role key for durable persistence" },
  { name: "INTEGRATION_APAAR_KEY", required: false, description: "APAAR provisioning credential" },
  { name: "INTEGRATION_AADHAAR_KEY", required: false, description: "Aadhaar authentication credential" },
  { name: "INTEGRATION_DIGILOCKER_KEY", required: false, description: "DigiLocker integration credential" },
  { name: "INTEGRATION_DBT_KEY", required: false, description: "DBT/APBS transfer credential" },
  { name: "INTEGRATION_BHASHINI_KEY", required: false, description: "Bhashini language-stack credential" },
]

type Env = Record<string, string | undefined>

function defaultEnv(): Env {
  // Indirect access so client bundles don't inline values; server reads the real env.
  return (typeof process !== "undefined" && process.env ? process.env : {}) as Env
}

/** Retrieve a secret by name through the active provider. Returns undefined if unset. */
export function getSecret(name: string, env: Env = defaultEnv()): string | undefined {
  // env provider: direct lookup. vault/kms would dispatch here once wired.
  const v = env[name]
  return v && v.length > 0 ? v : undefined
}

/** Mask a secret value for safe display/logging: keep the last 4 chars at most. */
export function redact(value: string | undefined): string {
  if (!value) return "(unset)"
  if (value.length <= 4) return "****"
  return `****${value.slice(-4)}`
}

export interface SecretStatus {
  name: string
  required: boolean
  present: boolean
}

/** Presence-only report — never returns secret values. */
export function secretsReport(env: Env = defaultEnv(), refs: SecretRef[] = MANAGED_SECRETS): SecretStatus[] {
  return refs.map((r) => ({ name: r.name, required: r.required, present: getSecret(r.name, env) !== undefined }))
}

/** Required secrets that are missing — used to fail closed before serving. */
export function missingRequired(env: Env = defaultEnv(), refs: SecretRef[] = MANAGED_SECRETS): string[] {
  return refs.filter((r) => r.required && getSecret(r.name, env) === undefined).map((r) => r.name)
}

export interface SecretsSummary {
  provider: SecretProvider
  managed: number
  present: number
  requiredMissing: number
}

export function secretsSummary(env: Env = defaultEnv(), refs: SecretRef[] = MANAGED_SECRETS): SecretsSummary {
  const report = secretsReport(env, refs)
  return {
    provider: ACTIVE_PROVIDER,
    managed: refs.length,
    present: report.filter((s) => s.present).length,
    requiredMissing: missingRequired(env, refs).length,
  }
}
