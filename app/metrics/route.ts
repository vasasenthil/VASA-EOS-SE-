import { NextResponse } from "next/server"
import { renderPrometheusMetrics } from "@/lib/observability/metrics"

export async function GET() {
  return new NextResponse(renderPrometheusMetrics(), { headers: { "content-type": "text/plain; version=0.0.4" } })
}
