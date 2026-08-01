import { NextResponse, type NextRequest } from "next/server"

import { requireRole } from "@/lib/auth/require-role"
import { buildGovernanceEvidenceManifest } from "@/lib/governance/evidence-manifest"

export async function GET(req: NextRequest) {
  const roleCheck = await requireRole(req, ["ADMIN", "SECRETARY", "DIRECTOR"])
  if (!roleCheck.ok) return roleCheck.response
  return NextResponse.json(buildGovernanceEvidenceManifest(), {
    headers: {
      "cache-control": "no-store",
    },
  })
}
