import { exportSpans, formatOtlp, getSpans } from "@/lib/tracing"

// Recent in-process spans rendered as OTLP/JSON — the OpenTelemetry wire format.
// GET  → pull OTLP/JSON (a collector can scrape this).
// POST → push the buffered spans to OTEL_EXPORTER_OTLP_ENDPOINT (best-effort).
export const dynamic = "force-dynamic"

export async function GET() {
  return new Response(formatOtlp(getSpans()), {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  })
}

export async function POST() {
  const res = await exportSpans(getSpans())
  return Response.json(res, {
    status: res.ok ? 200 : 502,
    headers: { "cache-control": "no-store" },
  })
}
