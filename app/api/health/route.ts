import { NextResponse } from "next/server"
import { runSelfTests } from "@/lib/selftest"
import { toHealthPayload } from "@/lib/selftest/health"

// Machine-readable health probe for uptime monitors / load balancers. Runs the same
// guardrail self-tests as /health and returns 200 when healthy, 503 when any
// failable check fails. Always fresh; never cached.
export const dynamic = "force-dynamic"

export async function GET() {
  const payload = toHealthPayload(await runSelfTests())
  return NextResponse.json(payload.body, {
    status: payload.httpStatus,
    headers: { "cache-control": "no-store" },
  })
}
