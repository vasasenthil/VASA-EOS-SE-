import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/require-role"
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["ADMIN", "SECRETARY"])
  if (!auth.ok) return auth.response
  if (!isSupabaseAdminConfigured()) return NextResponse.json({ ready: false, code: "POLICY_DB_NOT_CONFIGURED", remediation: ["Set NEXT_PUBLIC_SUPABASE_URL", "Set SUPABASE_SERVICE_ROLE_KEY", "Set a PostgreSQL DATABASE_URL", "Run pnpm run deploy:migrate", "Redeploy"] }, { status: 503, headers: { "cache-control": "no-store" } })
  const { count, error } = await supabaseAdmin!.from("policies").select("id", { count: "exact", head: true })
  if (error) return NextResponse.json({ ready: false, code: "POLICY_SCHEMA_UNAVAILABLE", detail: error.message, remediation: ["Run pnpm run deploy:migrate", "Verify Supabase project and service-role secret belong to the same project"] }, { status: 503, headers: { "cache-control": "no-store" } })
  return NextResponse.json({ ready: true, code: "POLICY_DB_READY", policies: count ?? 0 }, { headers: { "cache-control": "no-store" } })
}
