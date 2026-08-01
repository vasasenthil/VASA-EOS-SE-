import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/require-role"
import { decideConfigurationProposal } from "@/lib/configuration/store"

interface RouteContext { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireRole(request, ["SECRETARY", "ADMIN"])
  if (!auth.ok) return auth.response
  const { decision } = await request.json() as { decision?: string }
  if (decision !== "approve" && decision !== "reject") return NextResponse.json({ error: "Decision must be approve or reject" }, { status: 400 })
  try {
    return NextResponse.json({ proposal: await decideConfigurationProposal((await context.params).id, auth.session.subject, decision) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Decision failed" }, { status: 409 })
  }
}
