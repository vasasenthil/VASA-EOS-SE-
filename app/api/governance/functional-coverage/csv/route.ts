import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/require-role"
import { buildFunctionalCoverageReport, functionalCoverageToCsv } from "@/lib/governance/functional-coverage"

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["ADMIN", "SECRETARY", "DIRECTOR"])
  if (!auth.ok) return auth.response
  return new NextResponse(functionalCoverageToCsv(buildFunctionalCoverageReport()), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="functional-module-coverage.csv"', "cache-control": "no-store" } })
}
