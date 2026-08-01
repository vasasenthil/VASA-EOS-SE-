export type RuntimeEnvironment = Record<string, string | undefined>

function first(env: RuntimeEnvironment, names: readonly string[]): string | undefined {
  for (const name of names) {
    const value = env[name]?.trim()
    if (value) return value
  }
  return undefined
}

/** Supabase REST/auth project endpoint. Supports the canonical and provider alias. */
export function resolveSupabaseUrl(env: RuntimeEnvironment = process.env): string | undefined {
  return first(env, ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"])
}

/** Browser-safe anonymous key. */
export function resolveSupabaseAnonKey(env: RuntimeEnvironment = process.env): string | undefined {
  return first(env, ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY"])
}

/** Privileged server-only key. This value must never be returned to a client or logged. */
export function resolveSupabaseServiceRoleKey(env: RuntimeEnvironment = process.env): string | undefined {
  return first(env, ["SUPABASE_SERVICE_ROLE_KEY"])
}

/**
 * PostgreSQL URI used for schema migrations. Prefer a direct/non-pooling URI;
 * Vercel's Supabase integration commonly supplies POSTGRES_URL_NON_POOLING.
 */
export function resolveMigrationDatabaseUrl(env: RuntimeEnvironment = process.env): string | undefined {
  return first(env, [
    "PRODUCTION_DATABASE_URL",
    "DATABASE_URL",
    "SUPABASE_DB_URL",
    "POSTGRES_URL_NON_POOLING",
    "POSTGRES_URL",
    "POSTGRES_PRISMA_URL",
  ])
}

export function isPostgresUrl(value: string | undefined): boolean {
  if (!value) return false
  try {
    const parsed = new URL(value)
    return ["postgres:", "postgresql:"].includes(parsed.protocol) && Boolean(parsed.hostname) && parsed.pathname !== "/"
  } catch {
    return false
  }
}

