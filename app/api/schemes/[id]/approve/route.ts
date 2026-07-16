import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/require-role"
import { approveSchemeStep } from "@/lib/stores/scheme-approval-store"
import { getScheme, schemeWorkflowId } from "@/lib/stores/scheme-store"

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireRole(req, ["SECRETARY", "MINISTER", "CABINET"])
  if (!auth.ok) return auth.response
  const { id } = await ctx.params
  const scheme = await getScheme(id)
  if (!scheme) return NextResponse.json({ error: "Scheme not found" }, { status: 404 })
  const body = await req.json()
  await approveSchemeStep(scheme.workflowId ?? schemeWorkflowId(id), Number(body.stepIndex ?? 0), auth.session.subject, body.comments ?? "Approved")
  return NextResponse.json({ ok: true })
}
