import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/require-role"
import { buildReadinessLedger, readinessLedgerToCsv } from "@/lib/governance/readiness-ledger"

export async function GET(request: NextRequest) {
  const roleCheck = await requireRole(request, ["ADMIN", "SECRETARY", "DIRECTOR"])
  if (!roleCheck.ok) return roleCheck.response
  return new NextResponse(readinessLedgerToCsv(buildReadinessLedger()), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="sovereign-readiness-ledger.csv"' } })
}
