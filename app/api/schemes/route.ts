import { NextRequest, NextResponse } from "next/server"
import { createScheme, listSchemes } from "@/lib/stores/scheme-store"
import { schemeFiltersSchema, schemeProposalSchema } from "@/lib/schemes/schemas"

const allowed = (req: NextRequest, roles: string[]) => roles.includes(req.headers.get("x-vasa-role") ?? "ADMIN")

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const filters = schemeFiltersSchema.parse({ query: sp.get("query") ?? undefined, status: sp.getAll("status") as any, category: sp.getAll("category") as any, minBudget: sp.get("minBudget") ? Number(sp.get("minBudget")) : undefined, maxBudget: sp.get("maxBudget") ? Number(sp.get("maxBudget")) : undefined })
  return NextResponse.json({ schemes: await listSchemes(filters) })
}

export async function POST(req: NextRequest) {
  if (!allowed(req, ["SECRETARY", "MINISTER", "CABINET", "ADMIN"])) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const proposal = schemeProposalSchema.parse(await req.json())
  const scheme = await createScheme(proposal)
  return NextResponse.json({ scheme }, { status: 201 })
}
