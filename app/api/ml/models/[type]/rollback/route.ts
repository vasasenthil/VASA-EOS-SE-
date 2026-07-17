import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/require-role"
import { rollbackModel } from "@/lib/ml/registry/rollback-model"
import { mlModelTypeSchema } from "@/lib/ml/types"

type Ctx = { params: Promise<{ type: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireRole(req, ["ML_ADMIN", "ADMIN"])
  if (!auth.ok) return auth.response

  const { type } = await ctx.params
  const body = await req.json().catch(() => ({}))
  await rollbackModel(mlModelTypeSchema.parse(type), body.rollbackReason ?? `Manual rollback by ${auth.session.email ?? auth.session.subject}`)
  return NextResponse.json({ ok: true })
}
