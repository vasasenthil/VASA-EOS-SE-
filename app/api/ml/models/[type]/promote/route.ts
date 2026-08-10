import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/require-role"
import { promoteModel } from "@/lib/ml/registry/promote-model"
import { mlModelTypeSchema } from "@/lib/ml/types"

type Ctx = { params: Promise<{ type: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireRole(req, ["ML_ADMIN", "ADMIN"])
  if (!auth.ok) return auth.response

  const { type } = await ctx.params
  const body = await req.json()
  await promoteModel(mlModelTypeSchema.parse(type), body.version, body.promotedBy ?? auth.session.email ?? auth.session.subject, body.approvalReason ?? "Manual ML promotion")
  return NextResponse.json({ ok: true })
}
