import { NextRequest, NextResponse } from "next/server"
import { promoteModel } from "@/lib/ml/registry/promote-model"
import { mlModelTypeSchema } from "@/lib/ml/types"
type Ctx={params:Promise<{type:string}>}
const allowed=(req:NextRequest)=>["ML_ADMIN","ADMIN"].includes(req.headers.get("x-vasa-role")??"ADMIN")
export async function POST(req:NextRequest,ctx:Ctx){ if(!allowed(req)) return NextResponse.json({error:"Forbidden"},{status:403}); const {type}=await ctx.params; const body=await req.json(); await promoteModel(mlModelTypeSchema.parse(type),body.version,body.promotedBy??"ml-admin",body.approvalReason??"Manual ML promotion"); return NextResponse.json({ok:true}) }
