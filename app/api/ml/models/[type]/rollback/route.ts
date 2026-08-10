import { NextRequest, NextResponse } from "next/server"
import { rollbackModel } from "@/lib/ml/registry/rollback-model"
import { mlModelTypeSchema } from "@/lib/ml/types"
type Ctx={params:Promise<{type:string}>}
const allowed=(req:NextRequest)=>["ML_ADMIN","ADMIN"].includes(req.headers.get("x-vasa-role")??"ADMIN")
export async function POST(req:NextRequest,ctx:Ctx){ if(!allowed(req)) return NextResponse.json({error:"Forbidden"},{status:403}); const {type}=await ctx.params; const body=await req.json().catch(()=>({})); await rollbackModel(mlModelTypeSchema.parse(type),body.rollbackReason??"Manual rollback"); return NextResponse.json({ok:true}) }
