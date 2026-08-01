export type PolicyDataMode = "live" | "development-demo" | "unavailable"

export function policyDataMode(input: { databaseConfigured: boolean; nodeEnv?: string; demoEnabled?: boolean }): PolicyDataMode {
  if (input.databaseConfigured) return "live"
  if (input.nodeEnv === "test" || (input.nodeEnv !== "production" && input.demoEnabled)) return "development-demo"
  return "unavailable"
}

export const POLICY_DATABASE_REQUIRED =
  "The policy database is unavailable. Configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, provide a PostgreSQL migration URI, run pnpm run deploy:migrate, and redeploy."
