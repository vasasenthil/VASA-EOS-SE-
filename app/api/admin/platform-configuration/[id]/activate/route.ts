import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/require-role"
import { activateConfigurationProposal } from "@/lib/configuration/store"

interface RouteContext { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireRole(request, ["ADMIN"])
  if (!auth.ok) return auth.response
  try {
    return NextResponse.json({ proposal: await activateConfigurationProposal((await context.params).id, auth.session.subject) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Activation failed" }, { status: 409 })
  }
}
