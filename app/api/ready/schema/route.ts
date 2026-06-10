import { NextResponse } from "next/server"
import { getDb } from "@/lib/persistence"
import { verifySchema } from "@/lib/persistence/schema"

// Durable-schema probe. Confirms the workflow-backed transactional tables exist
// in the configured database — the difference between "a key is set" and "writes
// actually persist". 503 when no DB is configured, or when any required table is
// missing (run scripts/021-create-workflow-flow-tables.sql); 200 when all present.
export const dynamic = "force-dynamic"

export async function GET() {
  const db = getDb()
  if (!db) {
    return NextResponse.json(
      {
        configured: false,
        ok: false,
        detail: "No service-role database configured (set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).",
      },
      { status: 503, headers: { "cache-control": "no-store" } },
    )
  }
  const verification = await verifySchema(db)
  return NextResponse.json(
    { configured: true, ...verification },
    { status: verification.ok ? 200 : 503, headers: { "cache-control": "no-store" } },
  )
}
