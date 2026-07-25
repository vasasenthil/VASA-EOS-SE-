import { type NextRequest, NextResponse } from "next/server"

import { requireRole } from "@/lib/auth/require-role"
import { buildInventoryLedger, inventoryLedgerToCsv } from "@/lib/governance/inventory-ledger"

export async function GET(request: NextRequest) {
  const denied = await requireRole(request, ["ADMIN", "SECRETARY", "DIRECTOR"])
  if (denied) return denied

  const csv = inventoryLedgerToCsv(buildInventoryLedger())
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="governance-inventory-ledger.csv"',
    },
  })
}
