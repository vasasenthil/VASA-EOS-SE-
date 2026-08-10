import { NextResponse } from "next/server"
import { getWorkerHealth } from "@/lib/observability/health"

export async function GET() {
  return NextResponse.json(getWorkerHealth("sla-monitor"))
}
