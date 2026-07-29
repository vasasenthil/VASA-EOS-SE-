import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/require-role"
import { collectSchoolOperationsSnapshot } from "@/lib/principal/collect-operations"
import { buildSchoolOperationsReport, schoolOperationsReportToCsv } from "@/lib/principal/operations-centre"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["PRINCIPAL", "ADMIN"])
  if (!auth.ok) return auth.response
  const schoolId = auth.session.tenant.schoolId
  if (!schoolId) return NextResponse.json({ error: "A school tenant assignment is required" }, { status: 403, headers: { "cache-control": "no-store" } })
  const report = buildSchoolOperationsReport(await collectSchoolOperationsSnapshot(schoolId), schoolId)
  if (request.nextUrl.searchParams.get("format") === "csv") {
    return new NextResponse(schoolOperationsReportToCsv(report), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="school-operations-report.csv"', "cache-control": "no-store" } })
  }
  return NextResponse.json(report, { headers: { "cache-control": "no-store" } })
}
