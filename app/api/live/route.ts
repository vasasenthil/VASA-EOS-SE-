import { NextResponse } from "next/server"
import { APP_VERSION } from "@/lib/readiness"

// Liveness probe (k8s livenessProbe). Returns 200 whenever the process can serve a
// request — it makes no downstream calls, so a restart loop is never triggered by a
// slow database. Use /api/ready for dependency readiness.
export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json(
    { status: "alive", version: APP_VERSION, uptimeSec: Math.round(process.uptime()), ts: new Date().toISOString() },
    { headers: { "cache-control": "no-store" } },
  )
}
