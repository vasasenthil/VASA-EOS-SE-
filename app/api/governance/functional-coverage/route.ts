import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/require-role"
import { buildFunctionalCoverageReport } from "@/lib/governance/functional-coverage"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["ADMIN", "SECRETARY", "DIRECTOR"])
  if (!auth.ok) return auth.response
  return NextResponse.json(buildFunctionalCoverageReport(), { headers: { "cache-control": "no-store" } })
}
