import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/require-role"
import { proposeScheme } from "@/lib/stores/scheme-approval-store"

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireRole(req, ["SECRETARY", "MINISTER", "CABINET"])
  if (!auth.ok) return auth.response
  const { id } = await ctx.params
  try {
  await proposeScheme(id, auth.session)
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Decision failed" }, { status: 409 }) }
  return NextResponse.json({ ok: true })
}
