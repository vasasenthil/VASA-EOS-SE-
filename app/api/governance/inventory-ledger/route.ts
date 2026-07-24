import { NextResponse } from "next/server"

import { buildInventoryLedger } from "@/lib/governance/inventory-ledger"

export async function GET() {
  return NextResponse.json(buildInventoryLedger())
}
