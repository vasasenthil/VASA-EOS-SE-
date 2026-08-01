import { NextResponse, type NextRequest } from "next/server"

import { requireRole } from "@/lib/auth/require-role"
import { buildProductionAcceptancePack } from "@/lib/governance/production-acceptance"

export async function GET(req: NextRequest) {
  const roleCheck = await requireRole(req, ["ADMIN", "SECRETARY", "DIRECTOR"])
  if (!roleCheck.ok) return roleCheck.response
  return NextResponse.json(buildProductionAcceptancePack())
}
