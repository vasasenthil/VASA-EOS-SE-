import { NextResponse } from "next/server"
import { integrationsReport } from "@/lib/integrations/status"

// Machine-readable integration posture: each port's live/mock mode and which config
// variables are present (never their values). Mirrors the /integrations page; always
// 200 (informational). Dynamic + uncached so it reflects current env.
export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json(integrationsReport(), { headers: { "cache-control": "no-store" } })
}
