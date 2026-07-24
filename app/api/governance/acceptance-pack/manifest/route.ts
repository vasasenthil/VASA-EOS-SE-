import { NextResponse } from "next/server"

import { buildGovernanceEvidenceManifest } from "@/lib/governance/evidence-manifest"

export async function GET() {
  return NextResponse.json(buildGovernanceEvidenceManifest(), {
    headers: {
      "cache-control": "no-store",
    },
  })
}
