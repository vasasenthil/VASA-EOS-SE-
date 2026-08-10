import { NextResponse } from "next/server"

import { buildProductionAcceptancePack, productionAcceptancePackToMarkdown } from "@/lib/governance/production-acceptance"

export async function GET() {
  const markdown = productionAcceptancePackToMarkdown(buildProductionAcceptancePack())
  return new NextResponse(markdown, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": 'attachment; filename="production-acceptance-pack.md"',
    },
  })
}
