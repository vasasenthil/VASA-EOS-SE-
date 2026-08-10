import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/require-role"
import {
  automateScholarshipDisbursement,
  issueDigiLockerCredential,
  provisionApaarAndSyncEmis,
  translateForBeneficiary,
  validateNdearReadiness,
} from "@/lib/integrations/phase6"

export const dynamic = "force-dynamic"

type Phase6Action = "scholarship-disbursement" | "apaar-provision" | "digilocker-credential" | "translate" | "ndear-validate"

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["SECRETARY", "DIRECTOR", "DEO", "BEO"])
  if (!auth.ok) return auth.response
  return NextResponse.json(validateNdearReadiness(), { headers: { "cache-control": "no-store" } })
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["SECRETARY", "DIRECTOR", "DEO", "BEO"])
  if (!auth.ok) return auth.response
  const body = await request.json() as { action?: Phase6Action; payload?: unknown }
  try {
    switch (body.action) {
      case "scholarship-disbursement":
        return NextResponse.json(await automateScholarshipDisbursement(body.payload as Parameters<typeof automateScholarshipDisbursement>[0]))
      case "apaar-provision":
        return NextResponse.json(await provisionApaarAndSyncEmis(body.payload as Parameters<typeof provisionApaarAndSyncEmis>[0]))
      case "digilocker-credential":
        return NextResponse.json(await issueDigiLockerCredential(body.payload as Parameters<typeof issueDigiLockerCredential>[0]))
      case "translate":
        return NextResponse.json(await translateForBeneficiary(body.payload as Parameters<typeof translateForBeneficiary>[0]))
      case "ndear-validate":
        return NextResponse.json(validateNdearReadiness())
      default:
        return NextResponse.json({ error: "Unsupported Phase 6 action" }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Phase 6 operation failed" }, { status: 422 })
  }
}
