import { formatPrometheus, getCounters } from "@/lib/metrics"

// Prometheus-format metrics endpoint. Process-local counters (e.g. audited events).
// Scrape with any Prometheus-compatible collector.
export const dynamic = "force-dynamic"

export async function GET() {
  return new Response(formatPrometheus(getCounters()), {
    status: 200,
    headers: { "content-type": "text/plain; version=0.0.4", "cache-control": "no-store" },
  })
}
