import { NextRequest, NextResponse } from "next/server"
import { createScheme, listSchemes } from "@/lib/stores/scheme-store"
import { schemeFiltersSchema, schemeProposalSchema } from "@/lib/schemes/schemas"
import { requireRole } from "@/lib/auth/require-role"

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ["SECRETARY", "MINISTER", "CABINET", "DIRECTOR", "DEO", "BEO", "PRINCIPAL"])
  if (!auth.ok) return auth.response
  const sp = req.nextUrl.searchParams
  const filters = schemeFiltersSchema.parse({ query: sp.get("query") ?? undefined, status: sp.getAll("status") as any, category: sp.getAll("category") as any, minBudget: sp.get("minBudget") ? Number(sp.get("minBudget")) : undefined, maxBudget: sp.get("maxBudget") ? Number(sp.get("maxBudget")) : undefined })
  return NextResponse.json({ schemes: (await listSchemes(filters)).filter(s => s.jurisdictionId === auth.session.tenant.stateId && s.jurisdictionId) })
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ["SECRETARY", "MINISTER", "CABINET"])
  if (!auth.ok) return auth.response
  const proposal = schemeProposalSchema.parse(await req.json())
  if (!auth.session.tenant.stateId) return NextResponse.json({ error: "State jurisdiction required" }, { status: 403 })
  const scheme = await createScheme({ ...proposal, proposedBy: auth.session.subject }, auth.session.tenant.stateId)
  return NextResponse.json({ scheme }, { status: 201 })
}
