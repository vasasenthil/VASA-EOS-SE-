// Resilient JSON-over-HTTP helper for the live integration adapters.
// Fail-soft: network errors, timeouts and non-2xx responses are captured and
// returned as a typed error rather than thrown, so a flaky upstream never crashes
// a request. Includes an AbortController timeout and a correlation id for the audit.

export interface HttpResult<T> {
  ok: boolean
  data?: T
  error?: string
  status?: number
  traceId: string
}

function traceId(): string {
  return `live-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export interface HttpOptions {
  method?: "GET" | "POST"
  headers?: Record<string, string>
  body?: unknown
  /** Request timeout in ms (default 8000). */
  timeoutMs?: number
}

export async function httpJson<T>(url: string, opts: HttpOptions = {}): Promise<HttpResult<T>> {
  const id = traceId()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 8000)
  try {
    const res = await fetch(url, {
      method: opts.method ?? "GET",
      headers: { "content-type": "application/json", accept: "application/json", ...(opts.headers ?? {}) },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
      cache: "no-store",
    })
    if (!res.ok) {
      return { ok: false, error: `Upstream responded ${res.status}`, status: res.status, traceId: id }
    }
    const data = (await res.json()) as T
    return { ok: true, data, status: res.status, traceId: id }
  } catch (e) {
    const reason = e instanceof Error ? (e.name === "AbortError" ? "Upstream timed out" : e.message) : "Unknown error"
    return { ok: false, error: reason, traceId: id }
  } finally {
    clearTimeout(timeout)
  }
}
