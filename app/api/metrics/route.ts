import { formatPrometheus, getCounters } from "@/lib/metrics"
import { rateLimit, clientKey } from "@/lib/ratelimit"

// Prometheus-format metrics endpoint. Process-local counters (e.g. audited events).
// Rate-limited per client (60/min) — a reference for the deploy-time limiter seam.
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const rl = rateLimit(`metrics:${clientKey(req.headers)}`, 60, 60_000)
  if (!rl.allowed) {
    return new Response("rate limited\n", {
      status: 429,
      headers: { "retry-after": String(Math.ceil((rl.resetAt - Date.now()) / 1000)), "cache-control": "no-store" },
    })
  }
  return new Response(formatPrometheus(getCounters()), {
    status: 200,
    headers: {
      "content-type": "text/plain; version=0.0.4",
      "cache-control": "no-store",
      "x-ratelimit-remaining": String(rl.remaining),
    },
  })
}
