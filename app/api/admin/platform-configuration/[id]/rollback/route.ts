import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/require-role"
import { proposeConfigurationRollback } from "@/lib/configuration/store"

interface RouteContext { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireRole(request, ["ADMIN", "SECRETARY"])
  if (!auth.ok) return auth.response
  try {
    return NextResponse.json({ proposal: await proposeConfigurationRollback((await context.params).id, auth.session.subject) }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Rollback proposal failed" }, { status: 409 })
  }
}
