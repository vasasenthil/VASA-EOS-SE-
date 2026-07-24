import { NextResponse } from "next/server"

import { buildProductionAcceptancePack } from "@/lib/governance/production-acceptance"

export async function GET() {
  return NextResponse.json(buildProductionAcceptancePack())
}
