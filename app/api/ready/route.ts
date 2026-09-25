import { NextResponse } from "next/server"
import { getDb } from "@/lib/persistence"

export const dynamic = "force-dynamic"

// Kubelet has no user credentials. Return only a boolean and bound the DB call;
// authenticated business-cutover diagnostics remain on their protected route.
export async function GET() {
  let ready = false
  try {
    const db = getDb()
    if (db) {
      const { error } = await db.from("platform_outbox").select("id").limit(1)
        .abortSignal(AbortSignal.timeout(2000))
      ready = !error
    }
  } catch { /* dependency failure means not ready */ }
  return NextResponse.json({ ready }, { status: ready ? 200 : 503, headers: { "cache-control": "no-store" } })
}
