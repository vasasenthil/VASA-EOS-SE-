import { type NextRequest, NextResponse } from "next/server"
import { collectOversight } from "@/app/governance/oversight/collect"
import { requireRole } from "@/lib/auth/require-role"
import { stateRollup } from "@/lib/portal-data"
import { buildSecretaryCommandReport, secretaryCommandReportToCsv } from "@/lib/secretary/command-centre"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["SECRETARY", "ADMIN"])
  if (!auth.ok) return auth.response
  const report = buildSecretaryCommandReport(stateRollup(), await collectOversight())
  if (request.nextUrl.searchParams.get("format") === "csv") {
    return new NextResponse(secretaryCommandReportToCsv(report), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="secretary-command-report.csv"', "cache-control": "no-store" } })
  }
  return NextResponse.json(report, { headers: { "cache-control": "no-store" } })
}

