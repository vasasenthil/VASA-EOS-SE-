import { type NextRequest, NextResponse } from "next/server"
import { collectOversight } from "@/app/governance/oversight/collect"
import { requireRole } from "@/lib/auth/require-role"
import { buildDirectorateOperationsReport, directorateOperationsReportToCsv } from "@/lib/director/operations-centre"
import { stateRollup } from "@/lib/portal-data"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["DIRECTOR", "ADMIN"])
  if (!auth.ok) return auth.response
  const report = buildDirectorateOperationsReport(stateRollup(), await collectOversight(), request.nextUrl.searchParams.get("directorate"))
  if (request.nextUrl.searchParams.get("format") === "csv") {
    const filename = `director-${report.directorate.id}-operations-report.csv`
    return new NextResponse(directorateOperationsReportToCsv(report), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${filename}"`, "cache-control": "no-store" } })
  }
  return NextResponse.json(report, { headers: { "cache-control": "no-store" } })
}
