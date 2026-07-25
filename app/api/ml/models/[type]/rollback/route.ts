import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/require-role"
import { rollbackModel } from "@/lib/ml/registry/rollback-model"
import { mlModelRollbackRequestSchema, mlModelTypeSchema } from "@/lib/ml/types"

type Ctx = { params: Promise<{ type: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireRole(req, ["ML_ADMIN", "ADMIN"])
  if (!auth.ok) return auth.response

  const { type } = await ctx.params
  const modelType = mlModelTypeSchema.safeParse(type)
  const body = mlModelRollbackRequestSchema.safeParse(await req.json().catch(() => null))
  if (!modelType.success || !body.success) {
    return NextResponse.json({ error: "Invalid model rollback request" }, { status: 400 })
  }

  const actor = auth.session.email ?? auth.session.subject
  await rollbackModel(modelType.data, `${body.data.rollbackReason} (authorized by ${actor})`)
  return NextResponse.json({ ok: true })
}
