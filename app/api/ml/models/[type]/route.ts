import { NextRequest, NextResponse } from "next/server"
import { getActiveModel } from "@/lib/ml/registry/get-active-model"
import { mlModelTypeSchema } from "@/lib/ml/types"
type Ctx={params:Promise<{type:string}>}
export async function GET(_:NextRequest,ctx:Ctx){ const {type}=await ctx.params; const modelType=mlModelTypeSchema.parse(type); const model=await getActiveModel(modelType); return model ? NextResponse.json({model}) : NextResponse.json({error:"No active model"},{status:404}) }
