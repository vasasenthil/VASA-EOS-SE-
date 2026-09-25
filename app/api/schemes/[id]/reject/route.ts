import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/require-role"
import { rejectSchemeStep } from "@/lib/stores/scheme-approval-store"
import { getScheme, schemeWorkflowId } from "@/lib/stores/scheme-store"

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireRole(req, ["SECRETARY", "MINISTER", "CABINET"])
  if (!auth.ok) return auth.response
  const { id } = await ctx.params
  const scheme = await getScheme(id)
  if (!scheme) return NextResponse.json({ error: "Scheme not found" }, { status: 404 })
  const body = await req.json()
  try {
  await rejectSchemeStep(scheme.workflowId ?? schemeWorkflowId(id), body.stepIndex, auth.session, body.reason ?? "Rejected")
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Decision failed" }, { status: 409 }) }
  return NextResponse.json({ ok: true })
}
