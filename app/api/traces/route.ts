import { formatOtlp, getSpans } from "@/lib/tracing"

// Recent in-process spans rendered as OTLP/JSON — the OpenTelemetry wire format.
// An OTLP-HTTP collector can scrape this, or the platform can be configured to
// push to OTEL_EXPORTER_OTLP_ENDPOINT. Per-instance, best-effort.
export const dynamic = "force-dynamic"

export async function GET() {
  return new Response(formatOtlp(getSpans()), {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  })
}
