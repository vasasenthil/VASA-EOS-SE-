import { NextResponse } from "next/server"
import { dbReady } from "@/lib/persistence"
import { envReport } from "@/lib/env"
import { buildReadiness, APP_VERSION } from "@/lib/readiness"

// Readiness probe (k8s readinessProbe / load-balancer health). Reports whether the
// app is configured and whether persistence is durable. 503 only when required
// configuration is missing ("unavailable"); "degraded" (in-memory) still serves 200.
export const dynamic = "force-dynamic"

export async function GET() {
  const env = envReport()
  const report = buildReadiness({
    dbReady: dbReady(),
    envOk: env.ok,
    mode: env.mode,
    missingRequired: env.missingRequired,
    version: APP_VERSION,
    uptimeSec: process.uptime(),
  })
  return NextResponse.json(report, {
    status: report.status === "unavailable" ? 503 : 200,
    headers: { "cache-control": "no-store" },
  })
}
