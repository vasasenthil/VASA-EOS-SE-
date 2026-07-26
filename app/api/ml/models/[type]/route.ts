import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/require-role"
import { getActiveModel } from "@/lib/ml/registry/get-active-model"
import { mlModelTypeSchema } from "@/lib/ml/types"

type Ctx = { params: Promise<{ type: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await requireRole(req, ["ML_ADMIN", "ADMIN", "DIRECTOR", "SECRETARY"])
  if (!auth.ok) return auth.response

  const { type } = await ctx.params
  const modelType = mlModelTypeSchema.safeParse(type)
  if (!modelType.success) {
    return NextResponse.json({ error: "Invalid model type" }, { status: 400 })
  }

  const headers = { "cache-control": "private, no-store" }
  const model = await getActiveModel(modelType.data)
  return model
    ? NextResponse.json({ model }, { headers })
    : NextResponse.json({ error: "No active model" }, { status: 404, headers })
}
