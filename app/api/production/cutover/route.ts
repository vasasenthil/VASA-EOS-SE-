import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/require-role"
import { productionCutoverReport } from "@/lib/production/cutover"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["SECRETARY", "DIRECTOR", "ADMIN"])
  if (!auth.ok) return auth.response
  const report = productionCutoverReport()
  return NextResponse.json(report, {
    status: report.ready ? 200 : 503,
    headers: { "cache-control": "no-store" },
  })
}
