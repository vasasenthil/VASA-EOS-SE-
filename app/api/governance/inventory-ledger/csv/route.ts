import { NextResponse } from "next/server"

import { buildInventoryLedger, inventoryLedgerToCsv } from "@/lib/governance/inventory-ledger"

export async function GET() {
  const csv = inventoryLedgerToCsv(buildInventoryLedger())
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="governance-inventory-ledger.csv"',
    },
  })
}
