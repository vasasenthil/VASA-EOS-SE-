import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/require-role"
import { getActiveModel } from "@/lib/ml/registry/get-active-model"
import { mlModelTypeSchema } from "@/lib/ml/types"

type Ctx = { params: Promise<{ type: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await requireRole(req, ["ML_ADMIN", "ADMIN", "DIRECTOR", "SECRETARY"])
  if (!auth.ok) return auth.response

  const { type } = await ctx.params
  const modelType = mlModelTypeSchema.parse(type)
  const model = await getActiveModel(modelType)
  return model ? NextResponse.json({ model }) : NextResponse.json({ error: "No active model" }, { status: 404 })
}
