// VASA-EOS(SE) — lightweight distributed-tracing seam (Operations pillar).
//
// A pure, dependency-free span model + an in-process ring buffer (like lib/metrics).
// `withSpan` wraps a server operation; spans carry a trace/span id, duration and
// status. `formatOtlp` renders OTLP/JSON — the exact shape a real OpenTelemetry
// collector ingests, so shipping traces becomes config (OTEL_EXPORTER_OTLP_ENDPOINT)
// rather than code. Per-instance + best-effort; never throws into the caller.

export type SpanStatus = "ok" | "error"

export interface Span {
  traceId: string
  spanId: string
  parentId?: string
  name: string
  startMs: number
  endMs?: number
  durationMs?: number
  status: SpanStatus
  attributes: Record<string, string | number | boolean>
}

function hex(bytes: number): string {
  let s = ""
  for (let i = 0; i < bytes; i++) s += Math.floor(Math.random() * 256).toString(16).padStart(2, "0")
  return s
}

const MAX_SPANS = 200
const buffer: Span[] = []

function record(span: Span): void {
  buffer.push(span)
  if (buffer.length > MAX_SPANS) buffer.splice(0, buffer.length - MAX_SPANS)
}

export interface StartOptions {
  attributes?: Record<string, string | number | boolean>
  parent?: Pick<Span, "traceId" | "spanId">
  now?: number
}

/** Begin a span. Pass a parent to nest within an existing trace. */
export function startSpan(name: string, opts: StartOptions = {}): Span {
  return {
    traceId: opts.parent?.traceId ?? hex(16),
    spanId: hex(8),
    parentId: opts.parent?.spanId,
    name,
    startMs: opts.now ?? Date.now(),
    status: "ok",
    attributes: opts.attributes ?? {},
  }
}

/** Finish a span and record it to the buffer. Returns the completed span. */
export function endSpan(span: Span, status: SpanStatus = "ok", now?: number): Span {
  const endMs = now ?? Date.now()
  const done: Span = { ...span, endMs, durationMs: Math.max(0, endMs - span.startMs), status }
  record(done)
  return done
}

/** Trace an async operation: records ok on success, error on throw (then rethrows). */
export async function withSpan<T>(
  name: string,
  fn: () => Promise<T>,
  opts: StartOptions = {},
): Promise<T> {
  const span = startSpan(name, opts)
  try {
    const result = await fn()
    endSpan(span, "ok")
    return result
  } catch (e) {
    endSpan({ ...span, attributes: { ...span.attributes, error: String(e) } }, "error")
    throw e
  }
}

export function getSpans(): Span[] {
  return [...buffer]
}

export function resetSpans(): void {
  buffer.length = 0
}

export interface TraceSummary {
  spans: number
  errors: number
  avgMs: number
}

export function traceSummary(spans: Span[] = buffer): TraceSummary {
  const done = spans.filter((s) => s.durationMs != null)
  const total = done.reduce((n, s) => n + (s.durationMs ?? 0), 0)
  return {
    spans: spans.length,
    errors: spans.filter((s) => s.status === "error").length,
    avgMs: done.length === 0 ? 0 : Math.round(total / done.length),
  }
}

/**
 * Render spans as OTLP/JSON (the OpenTelemetry wire format). This is the exporter
 * seam: POST this body to an OTLP-HTTP collector at OTEL_EXPORTER_OTLP_ENDPOINT.
 */
export function formatOtlp(spans: Span[] = buffer): string {
  return JSON.stringify({
    resourceSpans: [
      {
        resource: { attributes: [{ key: "service.name", value: { stringValue: "vasa-eos-se" } }] },
        scopeSpans: [
          {
            scope: { name: "vasa-eos/tracing" },
            spans: spans.map((s) => ({
              traceId: s.traceId,
              spanId: s.spanId,
              parentSpanId: s.parentId ?? "",
              name: s.name,
              startTimeUnixNano: s.startMs * 1_000_000,
              endTimeUnixNano: (s.endMs ?? s.startMs) * 1_000_000,
              status: { code: s.status === "error" ? 2 : 1 },
              attributes: Object.entries(s.attributes).map(([key, v]) => ({
                key,
                value: typeof v === "number" ? { intValue: v } : typeof v === "boolean" ? { boolValue: v } : { stringValue: String(v) },
              })),
            })),
          },
        ],
      },
    ],
  })
}

// ── OTLP-HTTP push exporter ──────────────────────────────────────────────────
type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{ ok: boolean; status: number }>

/** The configured OTLP-HTTP collector endpoint, or undefined when unset. */
export function otlpEndpoint(): string | undefined {
  return process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.replace(/\/$/, "") || undefined
}

export interface ExportResult {
  ok: boolean
  exported: number
  /** True when no endpoint is configured (export is a no-op, not a failure). */
  skipped: boolean
  status?: number
  error?: string
}

/**
 * Push spans to an OTLP-HTTP collector ( POST <endpoint>/v1/traces ). Best-effort:
 * never throws, returns a typed result. No endpoint => skipped (not an error).
 * `fetchImpl` is injectable for testing.
 */
export async function exportSpans(
  spans: Span[] = buffer,
  opts: { endpoint?: string; fetchImpl?: FetchLike } = {},
): Promise<ExportResult> {
  const endpoint = opts.endpoint ?? otlpEndpoint()
  if (!endpoint) return { ok: true, exported: 0, skipped: true }
  if (spans.length === 0) return { ok: true, exported: 0, skipped: false }
  const doFetch = (opts.fetchImpl ?? (globalThis.fetch as unknown as FetchLike))
  try {
    const res = await doFetch(`${endpoint}/v1/traces`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: formatOtlp(spans),
    })
    return { ok: res.ok, exported: res.ok ? spans.length : 0, skipped: false, status: res.status }
  } catch (e) {
    return { ok: false, exported: 0, skipped: false, error: String(e) }
  }
}
