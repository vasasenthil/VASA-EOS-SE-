import { timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/require-role"
import { productionCutoverReport } from "@/lib/production/cutover"

export const dynamic = "force-dynamic"

function secretsMatch(configured: string, provided: string): boolean {
  const configuredBuffer = new Uint8Array(Buffer.from(configured))
  const providedBuffer = new Uint8Array(Buffer.from(provided))
  return configuredBuffer.length === providedBuffer.length && timingSafeEqual(configuredBuffer, providedBuffer)
}

function hasCutoverSecret(request: NextRequest): boolean {
  const configured = process.env.CUTOVER_SHARED_SECRET
  const provided = request.headers.get("x-cutover-secret")
  return Boolean(configured && provided && secretsMatch(configured, provided))
}

export async function GET(request: NextRequest) {
  if (!hasCutoverSecret(request)) {
    const auth = await requireRole(request, ["SECRETARY", "DIRECTOR", "ADMIN"])
    if (!auth.ok) return auth.response
  }
  const report = productionCutoverReport()
  return NextResponse.json(report, {
    status: report.ready ? 200 : 503,
    headers: { "cache-control": "no-store" },
  })
}
