import { type NextRequest, NextResponse } from "next/server"

import { requireRole } from "@/lib/auth/require-role"
import { buildInventoryLedger } from "@/lib/governance/inventory-ledger"

export async function GET(request: NextRequest) {
  const roleCheck = await requireRole(request, ["ADMIN", "SECRETARY", "DIRECTOR"])
  if (!roleCheck.ok) return roleCheck.response

  return NextResponse.json(buildInventoryLedger())
}
