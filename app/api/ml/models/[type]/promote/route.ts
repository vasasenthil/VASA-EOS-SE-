import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/require-role"
import { promoteModel } from "@/lib/ml/registry/promote-model"
import { mlModelPromotionRequestSchema, mlModelTypeSchema } from "@/lib/ml/types"

type Ctx = { params: Promise<{ type: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireRole(req, ["ML_ADMIN", "ADMIN"])
  if (!auth.ok) return auth.response

  const { type } = await ctx.params
  const modelType = mlModelTypeSchema.safeParse(type)
  const body = mlModelPromotionRequestSchema.safeParse(await req.json().catch(() => null))
  if (!modelType.success || !body.success) {
    return NextResponse.json({ error: "Invalid model promotion request" }, { status: 400 })
  }

  const promotedBy = auth.session.email ?? auth.session.subject
  await promoteModel(modelType.data, body.data.version, promotedBy, body.data.approvalReason)
  return NextResponse.json({ ok: true })
}
