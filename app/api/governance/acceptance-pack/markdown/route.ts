import { NextResponse, type NextRequest } from "next/server"

import { requireRole } from "@/lib/auth/require-role"
import { buildProductionAcceptancePack, productionAcceptancePackToMarkdown } from "@/lib/governance/production-acceptance"

export async function GET(req: NextRequest) {
  const roleCheck = await requireRole(req, ["ADMIN", "SECRETARY", "DIRECTOR"])
  if (!roleCheck.ok) return roleCheck.response
  const markdown = productionAcceptancePackToMarkdown(buildProductionAcceptancePack())
  return new NextResponse(markdown, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": 'attachment; filename="production-acceptance-pack.md"',
    },
  })
}
