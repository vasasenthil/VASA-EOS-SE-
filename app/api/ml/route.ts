import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/require-role"
import { listDriftReports, listModels, listPredictions } from "@/lib/ml/store"

export async function GET(req: NextRequest) {
  const view = req.nextUrl.searchParams.get("view") ?? "models"
  if (!(["models", "drift", "predictions"] as const).includes(view as "models" | "drift" | "predictions")) {
    return NextResponse.json({ error: "Unsupported ML administration view" }, { status: 400 })
  }

  const requiredRoles = view === "predictions"
    ? ["ML_ADMIN", "ADMIN"] as const
    : ["ML_ADMIN", "ADMIN", "DIRECTOR", "SECRETARY"] as const
  const auth = await requireRole(req, [...requiredRoles])
  if (!auth.ok) return auth.response

  const headers = { "cache-control": "private, no-store" }
  if (view === "drift") return NextResponse.json({ drift: await listDriftReports() }, { headers })
  if (view === "predictions") return NextResponse.json({ predictions: await listPredictions() }, { headers })
  return NextResponse.json({ models: await listModels() }, { headers })
}
