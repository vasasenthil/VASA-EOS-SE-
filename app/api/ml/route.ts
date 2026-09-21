import { NextRequest, NextResponse } from "next/server"
import { listDriftReports, listModels, listPredictions } from "@/lib/ml/store"
export async function GET(req: NextRequest) { const view=req.nextUrl.searchParams.get("view") ?? "models"; if(view==="drift") return NextResponse.json({drift:await listDriftReports()}); if(view==="predictions") return NextResponse.json({predictions:await listPredictions()}); return NextResponse.json({models:await listModels()}) }
