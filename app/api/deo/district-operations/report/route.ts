import { type NextRequest, NextResponse } from "next/server"
import { collectOversight } from "@/app/governance/oversight/collect"
import { requireRole } from "@/lib/auth/require-role"
import { buildDistrictOperationsReport, districtOperationsReportToCsv } from "@/lib/deo/district-operations"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["DEO", "ADMIN"])
  if (!auth.ok) return auth.response
  const districtId = auth.session.tenant.districtId
  if (!districtId) return NextResponse.json({ error: "A district jurisdiction assignment is required" }, { status: 403, headers: { "cache-control": "no-store" } })
  let report
  try { report = buildDistrictOperationsReport(districtId, await collectOversight()) } catch { return NextResponse.json({ error: "Invalid district jurisdiction assignment" }, { status: 403, headers: { "cache-control": "no-store" } }) }
  if (request.nextUrl.searchParams.get("format") === "csv") return new NextResponse(districtOperationsReportToCsv(report), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="district-school-heat-map.csv"', "cache-control": "no-store" } })
  return NextResponse.json(report, { headers: { "cache-control": "no-store" } })
}
